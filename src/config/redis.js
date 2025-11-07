import { createClient } from "redis";

let redisClient;

export const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("❌ Missing REDIS_URL environment variable");
  }

  redisClient = createClient({
    url: redisUrl,
    socket: {
      tls: true,                // ✅ required for Upstash
      rejectUnauthorized: false // ✅ avoids TLS cert issues
    }
  });

  redisClient.on("error", (err) => console.error("❌ Redis connection error:", err));
  redisClient.on("connect", () => console.log("✅ Redis connected successfully"));
  redisClient.on("ready", () => console.log("🚀 Redis ready"));

  await redisClient.connect();

  // Optional quick test
  await redisClient.set("testKey", "Hello from Upstash!");
  const value = await redisClient.get("testKey");
  console.log("📦 Redis test value:", value);

  return redisClient;
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error("Redis not connected yet");
  }
  return redisClient;
};



// 👇 Add this test block to run directly
if (process.argv[1].includes("redis.js")) {
  (async () => {
    try {
      console.log("🧩 Testing Redis connection...");
      const client = await connectRedis();
      await client.set("testKey", "Hello from Upstash!");
      const value = await client.get("testKey");
      console.log("📦 Redis test value:", value);
      await client.quit();
      console.log("✅ Test complete, connection closed.");
    } catch (err) {
      console.error("❌ Redis test failed:", err);
    }
  })();
}

