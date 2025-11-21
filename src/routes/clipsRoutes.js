// routes/clipRoutes.js
import express from "express";
import { getClips, createClip, deleteClip } from "../controllers/clipController.js"; // ← removed the "s"

const router = express.Router();

router.get("/clips", getClips);
router.post("/clips", createClip);
router.delete("/clips/:id", deleteClip);

export default router;