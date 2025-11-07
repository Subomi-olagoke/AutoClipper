import Queue from "bull";

const redisUrl = process.env.REDIS_URL;
const isCloud = redisUrl?.startsWith("rediss://");

export const clipQueue = new Queue("clipQueue", {
  redis: {
    url: redisUrl,
    tls: isCloud ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 30000, // 30 seconds timeout to avoid hanging
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});

clipQueue.on("ready", () => console.log("🚀 Bull queue ready and connected"));
clipQueue.on("error", (err) =>
  console.error("❌ Bull queue connection error:", err.message)
);

console.log(
  isCloud
    ? "🎯 clipQueue initialized using secure Upstash Redis (Bull v3)"
    : "🧩 clipQueue initialized using local Redis"
);
