// src/utils/twitchTokenManager.js
import axios from "axios";
import { setTimeout as wait } from "timers/promises";

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let accessToken = process.env.TWITCH_ACCESS_TOKEN || null;
let refreshToken = process.env.TWITCH_REFRESH_TOKEN || null;
let expiry = 0; // epoch ms

// ✅ Return current access token
export const getTwitchToken = () => accessToken;

// ✅ Initialize or refresh token (called on startup)
export const initTwitchTokens = async () => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn("⚠️ Twitch client id/secret not set in .env");
    return;
  }

  // Use valid token if not expired
  if (accessToken && Date.now() < expiry - 60_000) return accessToken;

  // Try to refresh existing token
  if (refreshToken) {
    try {
      const res = await axios.post(`https://id.twitch.tv/oauth2/token`, null, {
        params: {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        },
      });

      accessToken = res.data.access_token;
      refreshToken = res.data.refresh_token || refreshToken;
      expiry = Date.now() + res.data.expires_in * 1000;
      console.log("✅ Refreshed Twitch access token");
      return accessToken;
    } catch (err) {
      console.error("❌ Twitch refresh failed:", err.response?.data || err.message);
    }
  }

  // Fallback: get app-level token
  try {
    const res = await axios.post(`https://id.twitch.tv/oauth2/token`, null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
      },
    });

    accessToken = res.data.access_token;
    expiry = Date.now() + res.data.expires_in * 1000;
    console.log("✅ New app-level Twitch token fetched");
    return accessToken;
  } catch (err) {
    console.error("❌ Failed to fetch Twitch client credentials:", err.response?.data || err.message);
    throw err;
  }
};

// ✅ Manual refresh function (for periodic calls)
export const refreshTwitchToken = async () => {
  console.log("🔄 Attempting to refresh Twitch token...");
  return await initTwitchTokens();
};

// ✅ Start background auto-refresh loop
export const startAutoRefresh = (intervalMs = 50 * 60 * 1000) => {
  (async () => {
    await initTwitchTokens();
  })();

  setInterval(async () => {
    try {
      await refreshTwitchToken();
    } catch (e) {
      console.error("Auto-refresh Twitch token failed:", e.message);
    }
  }, intervalMs);
};
