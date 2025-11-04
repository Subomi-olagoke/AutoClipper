// src/testTwitchAuth.js
import { verifyTwitchAuth } from "./config/twitch.js";
import { connectDB } from "./config/db.js";
import { connectRedis } from "./config/redis.js";

(async () => {
  await connectDB();
  await connectRedis();
  await verifyTwitchAuth();
})();
