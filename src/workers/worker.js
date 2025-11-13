// src/workers/worker.js
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import axios from "axios";
import { clipQueue } from "../jobs/clipQueue.js";
import Clip from "../models/clipModel.js";
import "../config/db.js";

dotenv.config();

// --- Cloudinary setup ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("🎧 Cloudinary clip worker started");

// --- Mongo connection ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Worker connected to MongoDB"))
  .catch((err) => console.error("❌ Worker DB connection error:", err.message));

// --- Cloudinary-based clip processor ---
async function processClip(jobData) {
  const { url, title, duration = 15, startTime = 0 } = jobData;

  try {
    console.log(`🎬 Processing Cloudinary clip for: ${title}`);
    console.log("🔗 Stream URL:", url);

    // Remove invalid crop: "trim"
    const uploadResult = await cloudinary.uploader.upload(url, {
      resource_type: "video",
      folder: "autoclipper_clips",
      public_id: title.replace(/\s+/g, "_"),
      transformation: [
        { start_offset: startTime, end_offset: startTime + duration }, // trim correctly
        { fetch_format: "mp4" },
      ],
    });

    console.log(`✅ Cloudinary clip ready: ${uploadResult.secure_url}`);

    await Clip.create({
      title,
      url: uploadResult.secure_url,
      sourceUrl: url,
      createdAt: new Date(),
    });

    return uploadResult.secure_url;
  } catch (err) {
    console.error("❌ Cloudinary clip error:", err.message);
    throw err;
  }
}

// --- Clip queue processor ---
clipQueue.process("clip", async (job) => {
  console.log(`📦 New job received: ${job.name}`, job.data);
  return await processClip(job.data);
});

// --- AutoClip processor ---
clipQueue.process("autoClip", async (job) => {
  console.log(`📦 AutoClip job received: ${job.name}`, job.data);
  return await processClip(job.data);
});

// --- Queue events ---
clipQueue.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} completed → ${result}`);
});

clipQueue.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

// --- Optional: auto-trigger when spike detected ---
setInterval(async () => {
  try {
    const { data } = await axios.get(
      "https://autoclipper-8.onrender.com/api/comments/spike"
    );
    const { currentComments, baselineComments, streamUrl } = data;

    if (currentComments >= baselineComments * 5) {
      console.log("🔥 Spike detected (x5 comments)! Queuing new clip...");
      await clipQueue.add("autoClip", {
        url: streamUrl,
        title: `AutoClip-${Date.now()}`,
        duration: 15,
      });
    } else {
      console.log(`📊 No spike yet: ${currentComments}/${baselineComments * 5}`);
    }
  } catch (err) {
    console.error("⚠️ Spike check failed:", err.message);
  }
}, 60_000);
