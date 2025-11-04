import mongoose from "mongoose";

const clipSchema = new mongoose.Schema({
  clip_id: { type: String, unique: true, sparse: true }, // Twitch clip id OR generated id
  title: String,
  url: String, // public URL for download/play
  channel_name: String,
  start_ts: Date,
  end_ts: Date,
  download_url: { type: String }, // local S3 URL or static route
  method: { type: String, enum: ["twitch_api", "ffmpeg"], default: "twitch_api" },
}, { timestamps: true });

export default mongoose.model("Clip", clipSchema);

