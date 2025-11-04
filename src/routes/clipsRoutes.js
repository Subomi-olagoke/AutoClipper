// src/routes/clipsRoutes.js
import express from "express";
import { getClips, createClip } from "../controllers/clipsController.js";

const router = express.Router();

router.get("/", getClips);          // GET /api/clips
router.post("/create", createClip); // POST /api/clips/create

export default router;
