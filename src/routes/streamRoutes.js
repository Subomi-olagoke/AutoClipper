// src/routes/streamRoutes.js
import express from "express";
import { startStream } from "../controllers/streamController.js";

console.log("🚀 streamRoutes.js LOADED");

const router = express.Router();

router.post("/start", (req, res, next) => {
  console.log("🎯 POST /api/stream/start HIT");
  next();
}, startStream);

export default router;



