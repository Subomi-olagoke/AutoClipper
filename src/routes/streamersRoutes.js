// src/routes/streamersRoutes.js
import express from "express";
import { startMonitoringStreamer, stopMonitoringStreamer } from "../controllers/streamersController.js";

const router = express.Router();

// POST /api/streamers/watch { streamerLogin }
router.post("/watch", async (req, res) => {
  const { streamerLogin } = req.body;
  if (!streamerLogin) return res.status(400).json({ message: "streamerLogin required" });

  try {
    const result = await startMonitoringStreamer(streamerLogin);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Optional: stop monitoring
router.post("/stop", async (req, res) => {
  const { streamerLogin } = req.body;
  if (!streamerLogin) return res.status(400).json({ message: "streamerLogin required" });

  try {
    const result = stopMonitoringStreamer(streamerLogin);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
