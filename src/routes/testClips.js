// routes/testClips.js
import express from "express";
import { clipQueue } from "../jobs/clipQueue.js";

const router = express.Router();

// TEST ROUTE — hit these URLs in your browser
router.get("/test/twitch", async (req, res) => {
  await clipQueue.add("clip", { platform: "twitch",  streamerLogin: "marlon",    spikeComments: 9999 });
  res.send("Twitch clip queued! Check worker logs & /clips in 30s");
});

router.get("/test/youtube", async (req, res) => {
  await clipQueue.add("clip", { platform: "youtube", streamerLogin: "UxxajLWwzqY", spikeComments: 9999 });
  res.send("YouTube clip queued! (Rick Astley never dies)");
});

router.get("/test/kick", async (req, res) => {
  await clipQueue.add("clip", { platform: "kick",    streamerLogin: "adinross",  spikeComments: 9999 });
  res.send("Kick clip queued! Check logs");
});

router.get("/test/all", async (req, res) => {
  await clipQueue.add("clip", { platform: "twitch",  streamerLogin: "marlon",    spikeComments: 9999 });
  await clipQueue.add("clip", { platform: "youtube", streamerLogin: "UxxajLWwzqY", spikeComments: 9999 });
  await clipQueue.add("clip", { platform: "kick",    streamerLogin: "adinross",  spikeComments: 9999 });
  res.send("ALL 3 PLATFORMS QUEUED — GO CHECK /clips IN 1 MINUTE");
});

export default router;