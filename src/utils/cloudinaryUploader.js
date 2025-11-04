import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// function to upload
export const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "video", // since your clip is mp4
      folder: "twitch_clips",
    });
    console.log("✅ Uploaded to Cloudinary:", result.secure_url);
    return result.secure_url;
  } catch (err) {
    console.error("❌ Cloudinary upload error:", err.message);
    throw err;
  }
};
