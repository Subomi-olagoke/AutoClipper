import Queue from "bull";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const isCloud = redisUrl.startsWith("rediss://");

// 🧠 Disable the Bull internal ready check and retry system for Upstash
export const clipQueue = new Queue("clipQueue", {
  redis: {
    url: redisUrl,
    tls: isCloud ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
});

console.log(
  isCloud
    ? "🎯 clipQueue initialized using secure Upstash Redis (Bull v3)"
    : "🧩 clipQueue initialized using local Redis"
);