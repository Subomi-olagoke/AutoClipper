import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import clipsRoutes from "./routes/clipsRoutes.js";
import { connectDB } from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import { verifyTwitchAuth } from "./config/twitch.js";
import { initTwitchTokens, startAutoRefresh } from "./utils/twitchTokenManager.js";
import streamRoutes from "./routes/streamersRoutes.js";
import devRoutes from "./routes/devRoutes.js";
import { clipQueue } from "./jobs/clipQueue.js";
import spikeRoutes from "./routes/spike.js";
import { startChatListener } from "./twitch/chatTracker.js";
import streamersRoutes from "./routes/streamersRoutes.js";
import cloudinaryWebhook from "./routes/webhook/cloudinary.js";
import testClips from "./routes/testClips.js";
import { startYouTubeMonitoring } from "./workers/youtubeChatWorker.js";
import { startKickMonitoring } from "./workers/kickChatWorker.js";

// ← THIS WAS MISSING → YOU USE Clip.create() IN WEBHOOK
import Clip from "./models/clipModel.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/videos", express.static(path.join(process.cwd(), "public/videos")));

clipQueue.on("ready", () => console.log("API connected to Redis queue"));
clipQueue.on("error", (err) => console.error("Redis error:", err.message));

// Connect MongoDB
await connectDB();

if (process.env.NODE_ENV !== "production") {
  app.use("/dev", devRoutes);
}

// Connect Redis
await connectRedis();

// Verify Twitch credentials once at startup
await verifyTwitchAuth();

await initTwitchTokens();
startChatListener(process.env.STREAMER_LOGIN);

// Start monitoring for YouTube channel (replace with channel ID)
startYouTubeMonitoring("UC_x5XG1OV2P6uZZ5FSM9Ttw");  // PewDiePie example

await fetchKickToken();
setInterval(() => monitorKickChat('your-kick-channel'), 60000); // Poll every min

// Start monitoring for Kick streamer
startKickMonitoring("adinross");



// Auto-refresh Twitch token
startAutoRefresh();

// Routes
app.use("/api/clips", clipsRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/spike", spikeRoutes);
app.use("/api/streamers", streamersRoutes);
app.use("/", cloudinaryWebhook);
app.use("/", testClips); // ← makes /test/twitch work

app.post("/test", (req, res) => {
  console.log("/test route hit");
  res.send("Test route works");
});

app.get("/", (req, res) => {
  res.send("AutoClipper API is running with auto-refresh Twitch tokens!");
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});