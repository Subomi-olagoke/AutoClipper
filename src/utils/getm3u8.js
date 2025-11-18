import axios from "axios";
import { apiClient } from "../auth/twitch.js";

export async function getM3u8Url(streamerName) {
  try {
    // Get user
    const user = await apiClient.users.getUserByName(streamerName);
    if (!user) return "offline";

    // Get stream status
    const stream = await apiClient.streams.getStreamByUserId(user.id);
    if (!stream) return "offline";

    console.log("🔑 Getting access token...");

    // Get access token (This still works if you use USER ID)
    const { data } = await axios.get(
      `https://api.twitch.tv/api/channels/${user.id}/access_token`,
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          "Authorization": `Bearer ${process.env.TWITCH_APP_TOKEN}`, // NEW
        },
      }
    );

    const { sig, token } = data;

    return `https://usher.ttvnw.net/api/channel/hls/${streamerName}.m3u8?sig=${sig}&token=${token}&allow_source=true&allow_audio_only=true&allow_spectre=true`;
  } catch (err) {
    console.error("❌ Error fetching m3u8:", err.message);
    return null;
  }
}
