import { createClient } from "redis";

let redisClient;

export const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

  // Detect if Redis Cloud (TLS needed)
  const isCloud = redisUrl.startsWith("rediss://");

  redisClient = createClient({
    url: redisUrl,
    socket: isCloud
      ? { tls: true, rejectUnauthorized: false } // Redis Cloud (secure)
      : {}, // Local Redis (no TLS)
  });

  redisClient.on("error", (err) => console.error("❌ Redis error:", err));
  redisClient.on("connect", () => console.log("✅ Redis connected"));

  await redisClient.connect();
  return redisClient;
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error("Redis not connected yet");
  }
  return redisClient;
};
