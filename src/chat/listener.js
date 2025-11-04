import Queue from "bull";
import { pool } from "../config/db.js";

export const clipQueue = new Queue("clipQueue", "redis://127.0.0.1:6379");

clipQueue.process(async (job) => {
  const { channel } = job.data;
  console.log(`🎥 Processing clip for channel: ${channel}`);

  // Mock clip URL
  const clipUrl = `https://clips.twitch.tv/${channel}-${Date.now()}`;

  // Save to DB
  await pool.query(
    "INSERT INTO clips (channel, clip_url) VALUES ($1, $2)",
    [channel, clipUrl]
  );

  console.log(`✅ Clip saved to database for ${channel}`);
});
