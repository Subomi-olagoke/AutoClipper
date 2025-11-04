// src/jobs/clipQueue.js
import Queue from "bull";

export const clipQueue = new Queue("clipQueue", process.env.REDIS_URL || "redis://127.0.0.1:6379");
