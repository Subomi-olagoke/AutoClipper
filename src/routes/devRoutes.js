// src/routes/devRoutes.js
import express from "express";
import { pushMessage, checkSpike, handleSpike } from "../services/spikeService.js";
const router = express.Router();

router.post("/simulate/:channel", async (req, res) => {
  const { channel } = req.params;
  // push many messages quickly
  for (let i = 0; i < 50; i++) {
    await pushMessage(channel, Date.now() - Math.floor(Math.random() * 2000));
  }
  const spike = await checkSpike(channel);
  if (spike) {
    const job = await handleSpike(channel, { simulated: true });
    return res.json({ spike, jobId: job.id });
  }
  return res.json({ ok: true, spike: null });
});

export default router;
