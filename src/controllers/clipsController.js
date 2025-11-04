import Clip from "../models/clipModel.js";
import { captureClip } from "../utils/ffmpegHandler.js";
import { clipQueue } from "../jobs/clipQueue.js";

// ✅ Get all saved clips
export const getClips = async (req, res) => {
  try {
    const clips = await Clip.find().sort({ createdAt: -1 });
    res.json(clips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Create a new clip (Twitch or YouTube)
export const createClip = async (req, res) => {
  try {
    const { m3u8Url, title } = req.body;
    if (!m3u8Url || !title) {
      return res.status(400).json({ error: "m3u8Url and title are required" });
    }

    console.log(`🎬 Creating clip for: ${m3u8Url}`);
    const filePath = await captureClip(m3u8Url, "./buffer");

    await clipQueue.add({ filePath, title, channel: title });

    res.status(201).json({
      message: "Clip creation started, uploading in background...",
      filePath,
    });
  } catch (error) {
    console.error("❌ Error in createClip:", error.message);
    res.status(500).json({ error: error.message });
  }
};
