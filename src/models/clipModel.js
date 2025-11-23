import mongoose from "mongoose";

const clipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String }, // final public Cloudinary URL (set by webhook)
  
  streamerLogin: { type: String, required: true, index: true }, // e.g. "marlon"
  sourceUrl: { type: String }, // https://twitch.tv/marlon

  duration: { type: Number, default: 90 }, // in seconds

  cloudinaryPublicId: { 
    type: String, 
    unique: true, 
    sparse: true  // ← important: allows null temporarily
  },

  status: { 
    type: String, 
    enum: ["uploading", "ready", "failed"], 
    default: "uploading",
    index: true
  },

  spikeComments: { type: Number },     // optional: how many messages triggered it
  baselineComments: { type: Number },

  // Legacy fields (you can keep or ignore)
  channel_name: String,
  start_ts: Date,
  end_ts: Date,
  download_url: String,
  method: { type: String, enum: ["twitch_api", "ffmpeg", "streamlink"], default: "streamlink" },

}, { 
  timestamps: true 
});

// Index for fast queries on your /clips gallery
clipSchema.index({ createdAt: -1 });
clipSchema.index({ streamerLogin: 1, createdAt: -1 });
clipSchema.index({ status: 1 });

export default mongoose.model("Clip", clipSchema);