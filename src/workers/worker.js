// src/workers/worker.js
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { clipQueue } from "../jobs/clipQueue.js";
import { captureClip } from "../utils/ffmpegHandler.js";
import Clip from "../models/clipModel.js";
import mongoose from "mongoose";
import "../config/db.js";
import "../config/redis.js";

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Worker connected to MongoDB"))
  .catch((err) => console.error("❌ Worker DB connection error:", err.message));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("🎧 Clip worker started");

clipQueue.process(async (job) => {
  const { url, title, duration } = job.data;
  console.log(`🎥 Processing clip for: ${title}`);
  console.log("🔗 Stream URL received:", url);

  try {
    const outputDir = path.join(process.cwd(), "clips");
    const clipPath = await captureClip(url, outputDir, duration || 10);

    console.log("🧾 Returned clip path:", clipPath);

    if (!clipPath || !fs.existsSync(clipPath)) {
      console.error("⚠️ Clip file not found or path invalid:", clipPath);
      throw new Error("Clip path missing or file not found");
    }

    console.log(`☁️ Uploading to Cloudinary from: ${clipPath}`);
    const uploadResult = await cloudinary.uploader.upload(clipPath, {
      resource_type: "video",
      folder: "autoclipper_clips",
    });

    console.log("✅ Upload successful:", uploadResult.secure_url);

    await Clip.create({
      title,
      url: uploadResult.secure_url,
      createdAt: new Date(),
    });

    return uploadResult.secure_url;
  } catch (err) {
    console.error("❌ Worker error:", err.message);
    throw err;
  }
});
