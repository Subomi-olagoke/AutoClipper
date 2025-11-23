// routes/webhook/cloudinary.js
import express from "express";
import Clip from "../../models/clipModel.js";

const router = express.Router();

router.post("/webhook/cloudinary", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const event = JSON.parse(req.body);

    // We only care when the main upload OR the HLS conversion finishes
    if (event.notification_type === "upload" || event.notification_type === "eager") {
      const publicId = event.public_id; // e.g. "autoclipper_clips/marlon_123456789"

      // Just update the existing document we created in the worker
      const updated = await Clip.findOneAndUpdate(
        { cloudinaryPublicId: publicId },
        {
          url: event.secure_url || event.url,
          status: "ready"
        },
        { new: true }
      );

      if (updated) {
        console.log(`CLIP READY → ${publicId} | ${updated.url}`);
      } else {
        console.warn(`Clip not found in DB for public_id: ${publicId}`);
      }
    }

    // Always respond 200 fast — Cloudinary will retry if you don't
    res.status(200).send("OK");
  } catch (err) {
    console.error("Cloudinary webhook error:", err.message);
    res.status(400).send("Error");
  }
});

export default router;