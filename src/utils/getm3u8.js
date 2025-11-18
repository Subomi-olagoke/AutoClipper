// src/utils/getM3u8.js
import axios from "axios";
import { apiClient } from "../auth/twitch.js";

export async function getM3u8Url(streamerName) {
  try {
    // 1️⃣ Get Twitch user
    const user = await apiClient.users.getUserByName(streamerName);
    if (!user) return "offline";

    // 2️⃣ Check if live
    const stream = await apiClient.streams.getStreamByUserId(user.id);
    if (!stream) return "offline";

    console.log("🔑 Fetching GQL playback token...");

    // 3️⃣ Request channel access token using Web Client-ID + your App token
    const { data } = await axios.get(
      `https://api.twitch.tv/api/channels/${user.id}/access_token`,
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,        // Web Client-ID
          "Authorization": `Bearer ${process.env.TWITCH_APP_TOKEN}`, // App token
        },
      }
    );

    const { sig, token } = data;

    // 4️⃣ Return HLS URL
    return `https://usher.ttvnw.net/api/channel/hls/${streamerName}.m3u8?sig=${sig}&token=${token}&allow_source=true&allow_audio_only=true&allow_spectre=true`;
  } catch (err) {
    console.error("❌ Error fetching m3u8:", err.response?.data || err.message);
    return null;
  }
}
