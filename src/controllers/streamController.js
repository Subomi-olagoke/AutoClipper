// src/controllers/streamController.js
import { pushMessage, checkSpike, handleSpike } from "../services/spikeService.js";

export const startStream = async (req, res) => {
  console.log("✅ startStream controller EXECUTED");
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "Twitch URL is required" });

  // extract username from url
  const username = url.split("twitch.tv/").pop().split(/[/?#]/)[0];

  // For the MVP: start a simple simulation: push messages over time (in-memory)
  // In real product: spawn tmi.js listener that calls pushMessage(...) as chat arrives
  // Here just respond with started and recommend calling /dev/simulate/<username> to test
  res.json({ message: `Stream started for ${username}`, channel: username, note: "Call /dev/simulate/:channel to simulate spike" });
};
