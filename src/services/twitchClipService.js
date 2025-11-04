import pool from "../config/db.js";

// Simulated function that runs whenever a Twitch clip is auto-created
export const saveTwitchClipToDB = async (clipData) => {
  const { id, title, url } = clipData;
  try {
    await pool.query(
      `INSERT INTO clips (clip_id, title, url)
       VALUES ($1, $2, $3)
       ON CONFLICT (clip_id) DO NOTHING;`,
      [id, title, url]
    );
    console.log(`✅ Saved Twitch clip: ${title}`);
  } catch (err) {
    console.error("❌ Error saving clip:", err.message);
  }
};
