// src/config/twitchAuth.js
import axios from "axios";

let twitchToken = null;
let tokenExpiry = 0;

export const getTwitchAccessToken = async (clientId, clientSecret) => {
  const now = Date.now();

  // 🔁 If token is still valid, reuse it
  if (twitchToken && now < tokenExpiry) {
    return twitchToken;
  }

  try {
    console.log("🔄 Fetching new Twitch access token...");
    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "client_credentials",
        },
      }
    );

    twitchToken = response.data.access_token;
    tokenExpiry = now + response.data.expires_in * 1000;

    console.log("✅ New Twitch token fetched successfully.");
    return twitchToken;
  } catch (err) {
    console.error("❌ Failed to get Twitch token:", err.response?.data || err.message);
    throw new Error("Twitch token fetch failed");
  }
};
