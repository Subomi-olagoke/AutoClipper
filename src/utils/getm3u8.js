// src/utils/getm3u8.js
import axios from "axios";
import { apiClient } from "../auth/twitch.js";

export async function getM3u8Url(streamerName) {
  try {
    // 1️⃣ Get user info
    const user = await apiClient.users.getUserByName(streamerName);
    if (!user) return "offline";

    // 2️⃣ Check if the stream is live
    const stream = await apiClient.streams.getStreamByUserId(user.id);
    if (!stream) return "offline";

    console.log("🔑 Fetching HLS access token...");

    // 3️⃣ Request the HLS access token
    const { data } = await axios.post(
      `https://id.twitch.tv/oauth2/token`,
      null,
      {
        params: {
          client_id: process.env.TWITCH_CLIENT_ID,   // YOUR App Client-ID
          client_secret: process.env.TWITCH_CLIENT_SECRET, // YOUR App Secret
          grant_type: "client_credentials",
        },
      }
    );

    const appAccessToken = data.access_token;

    // 4️⃣ Get the channel playback token
    const tokenRes = await axios.get(
      `https://api.twitch.tv/api/channels/${user.id}/access_token`,
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          "Authorization": `Bearer ${appAccessToken}`,
        },
      }
    );

    const { sig, token } = tokenRes.data;

    // 5️⃣ Return the HLS URL
    return `https://usher.ttvnw.net/api/channel/hls/${streamerName}.m3u8?sig=${sig}&token=${token}&allow_source=true&allow_audio_only=true&allow_spectre=true`;
  } catch (err) {
    console.error("❌ Error fetching m3u8:", err.message);
    return null;
  }
}
