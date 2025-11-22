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

// Auto-refresh Twitch token
startAutoRefresh();

// Routes
app.use("/api/clips", clipsRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/spike", spikeRoutes);
app.use("/api/streamers", streamersRoutes);

app.post("/test", (req, res) => {
  console.log("/test route hit");
  res.send("Test route works");
});

app.get("/", (req, res) => {
  res.send("AutoClipper API is running with auto-refresh Twitch tokens!");
});

// ———— CLOUIDINARY WEBHOOK ————
app.post("/webhook/cloudinary", async (req, res) => {
  const notification = req.body;

  if (notification.notification_type === "eager" && notification.eager) {
    for (const asset of notification.eager) {
      if (asset.status === "complete") {
        const streamer = notification.public_id.split("_")[0];

        // Send real-time alert to frontend
        if (global.io) {
          global.io.emit("clip-success", {
            message: `90s BANGER READY → ${streamer.toUpperCase()}`,
            url: asset.secure_url,
            title: notification.public_id,
            streamer,
            duration: 90,
            timestamp: new Date().toLocaleString(),
            isEager: true
          });
        }

        // Save to DB (safe even if server restarted)
        try {
          await Clip.create({
            title: notification.public_id,
            url: asset.secure_url,
            sourceUrl: `https://twitch.tv/${streamer}`,
            streamerLogin: streamer,
            duration: 90,
          });
        } catch (err) {
          console.error("Failed to save clip from webhook:", err.message);
        }
      }
    }
  }

  // Always respond 200 fast
  res.status(200).send("OK");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});