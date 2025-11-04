// src/config/twitch.js
import axios from "axios";
import { ENV } from "./env.js";
import { getTwitchAccessToken } from "./twitchAuth.js";

const TWITCH_API_BASE = "https://api.twitch.tv/helix";

export const twitchAPI = axios.create({
  baseURL: TWITCH_API_BASE,
});

// ✅ Attach auth headers dynamically before each request
twitchAPI.interceptors.request.use(async (config) => {
  const token = await getTwitchAccessToken(ENV.TWITCH_CLIENT_ID, ENV.TWITCH_CLIENT_SECRET);
  config.headers["Client-ID"] = ENV.TWITCH_CLIENT_ID;
  config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// ✅ Test your connection
export const verifyTwitchAuth = async () => {
  try {
    const broadcaster = process.env.TWITCH_BROADCASTER;
    if (!broadcaster) {
      console.warn("⚠️ No TWITCH_BROADCASTER specified in .env, skipping user check.");
      return;
    }

    const response = await twitchAPI.get("/users", {
      params: { login: broadcaster },
    });

    // Handle empty or invalid responses gracefully
    const user = response.data?.data?.[0];
    if (!user) {
      console.error("❌ No Twitch user found for broadcaster:",broadcaster);
      return;
    }

    console.log(`✅ Twitch Authenticated as ${user.display_name} (ID: ${user.id})`);
    return user;
  } catch (err) {
    console.error("❌ Twitch auth verification failed:", err.response?.data || err.message);
  }
};


