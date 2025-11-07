import { createClient } from "redis";

let redisClient;

export const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.error("Missing REDIS_URL environment variable");
    process.exit(1);
  }

  // Parse the URL manually to extract host, port, password
  const url = new URL(redisUrl);
  const isSecure = redisUrl.startsWith("rediss://");

  redisClient = createClient({
    socket: {
      host: url.hostname,
      port: parseInt(url.port) || (isSecure ? 443 : 6379),
      tls: isSecure,
      // Critical: Allow self-signed certs from Redis Cloud
      rejectUnauthorized: false,
    },
    password: url.password || undefined,
    // Optional: Add connection timeout
    connectTimeout: 10000,
  });

  redisClient.on("connect", () => console.log("Redis connected successfully"));
  redisClient.on("ready", () => console.log("Redis ready to accept commands"));
  redisClient.on("error", (err) =>
    console.error("Redis connection error:", err.message)
  );
  redisClient.on("reconnecting", () => console.log("Redis reconnecting..."));

  try {
    await redisClient.connect();
    console.log("Redis client connected");
  } catch (err) {
    console.error("Redis connect() failed:", err.message);
    // Don't exit — allow retry logic
  }

  return redisClient;
};

export const getRedisClient = () => {
  if (!redisClient) throw new Error("Redis not connected yet");
  return redisClient;
};