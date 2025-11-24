// src/workers/worker.js
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import Clip from "../models/clipModel.js";
import "../config/db.js";
import { join } from "path";
import { tmpdir } from "os";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { clipQueue } from "../jobs/clipQueue.js";

const execAsync = promisify(exec);

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("ULTIMATE MULTI-PLATFORM CLIPPER → TWITCH / YOUTUBE / KICK");

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Worker → MongoDB connected"))
  .catch(err => console.error("Worker DB error:", err));

async function processLiveClip(jobData) {
  const {
    platform = "twitch",
    streamerLogin,
    title = `${platform}_${streamerLogin}_${Date.now()}`,
    duration = 90,
    spikeComments,
    baselineComments
  } = jobData;

  const tempPath = join(tmpdir(), `${Date.now()}_clip.mp4`);

  try {
    console.log(`Recording ${duration}s from ${platform.toUpperCase()} → ${streamerLogin}`);

    let cmd;

    if (platform === "youtube") {
      const url = streamerLogin.startsWith("http") ? streamerLogin : `https://youtube.com/watch?v=${streamerLogin}`;
      cmd = `yt-dlp -f "best[height<=1080]" --hls-use-mpegts --no-part --wait-for-video 30 -o "${tempPath}" "${url}"`;
    } 
    else if (platform === "kick") {
      cmd = `streamlink --hls-duration ${duration} --output "${tempPath}" "https://kick.com/${streamerLogin}" best`;
    } 
    else { // twitch
      cmd = `streamlink --twitch-disable-ads --hls-duration ${duration} --output "${tempPath}" "https://twitch.tv/${streamerLogin}" best`;
    }

    console.log("Running:", cmd);
    await execAsync(cmd, { timeout: 240000 });

    if (!fs.existsSync(tempPath)) throw new Error("No file created");

    const stats = fs.statSync(tempPath);
    console.log(`Clip recorded → ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    if (stats.size < 8 * 1024 * 1024) throw new Error("Clip too small — stream offline");

    const safePublicId = title.replace(/[^a-zA-Z0-9_-]/g, "_");

    const clipDoc = await Clip.create({
      title,
      streamerLogin,
      sourceUrl: platform === "youtube" 
        ? (streamerLogin.startsWith("http") ? streamerLogin : `https://youtube.com/watch?v=${streamerLogin}`)
        : `https://${platform}.com/${streamerLogin}`,
      platform,
      duration,
      cloudinaryPublicId: `autoclipper_clips/${safePublicId}`,
      spikeComments,
      baselineComments,
      status: "uploading"
    });

    console.log(`DB entry → ${clipDoc._id} (${platform})`);

    cloudinary.uploader.upload(tempPath, {
      resource_type: "video",
      folder: "autoclipper_clips",
      public_id: safePublicId,
      format: "mp4",
      async: true,
      upload_preset: "twitch_raw_fast",
      eager: [],
      eager_notification_url: "https://autoclipper-shb4.onrender.com/webhook/cloudinary"
    });

    console.log(`Upload sent → ${safePublicId}`);

    if (global.io) {
      global.io.emit("clip-success", {
        message: `${platform.toUpperCase()} BANGER`,
        title, platform, streamer: streamerLogin, duration, spike: spikeComments,
        status: "uploading", clipId: clipDoc._id
      });
    }

    return clipDoc._id;

  } catch (err) {
    console.error(`FAILED ${platform} ${streamerLogin}:`, err.message);
    return null;
  } finally {
    setTimeout(() => fs.existsSync(tempPath) && fs.unlinkSync(tempPath), 10000);
  }
}

clipQueue.process("clip", async (job) => await processLiveClip(job.data));
clipQueue.process("autoClip", async (job) => await processLiveClip(job.data));