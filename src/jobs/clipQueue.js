// src/jobs/clipQueue.js
import Queue from "bull";
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

// Create a Redis client with TLS
const redisClient = new Redis(process.env.REDIS_URL, { tls: {} });

export const clipQueue = new Queue("clipQueue", {
  createClient: function (type) {
    switch (type) {
      case "client":
        return redisClient;
      case "subscriber":
        return new Redis(process.env.REDIS_URL, { tls: {} });
      default:
        return new Redis(process.env.REDIS_URL, { tls: {} });
    }
  },
});

clipQueue.on("ready", () => {
  console.log("🚀 Bull queue connected to Upstash Redis and ready");
});

clipQueue.on("error", (err) => {
  console.error("❌ Bull queue error:", err.message);
});
