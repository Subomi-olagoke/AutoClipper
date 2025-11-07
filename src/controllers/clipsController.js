import Clip from "../models/clipModel.js";
import { clipQueue } from "../jobs/clipQueue.js";


// GET all clips
export const getClips = async (req, res) => {
  try {
    const clips = await Clip.find().sort({ createdAt: -1 });
    res.json(clips);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch clips" });
  }
};

// CREATE clip job
export const createClip = async (req, res) => {
  try {
    const { m3u8Url, title } = req.body;

    if (!m3u8Url || !title) {
      return res.status(400).json({ error: "Missing URL or title" });
    }

    console.log("📥 Received request:", { m3u8Url, title });

    // ⬇️ Debug: Before adding to queue
    console.log("🕐 Adding to clipQueue...");

    await clipQueue.add({ url: m3u8Url, title });

    // ⬇️ Debug: After adding to queue
    console.log(`🎬 Queued new clip: ${title}`);

    return res.json({ message: "Clip queued successfully!" });
  } catch (err) {
    console.error("❌ Error queueing clip:", err);
    return res.status(500).json({ error: err.message });
  }
};


