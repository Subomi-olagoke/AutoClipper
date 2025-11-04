import Queue from "bull";
import { uploadToCloudinary } from "../utils/cloudinaryUploader.js";
import Clip from "../models/clipModel.js";

export const clipQueue = new Queue("clipQueue", process.env.REDIS_URL || "redis://127.0.0.1:6379");

clipQueue.process(async (job) => {
  console.log(`🎥 Processing clip for channel: ${job.data.channel}`);

  const { filePath, title } = job.data;

  // Upload to Cloudinary
  const cloudUrl = await uploadToCloudinary(filePath);

  // Save to MongoDB
  const clip = await Clip.create({
    title,
    url: cloudUrl,
    createdAt: new Date(),
  });

  console.log(`✅ Clip saved to MongoDB: ${clip.title}`);
  return clip;
});
