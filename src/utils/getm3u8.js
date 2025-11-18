import axios from "axios";
import { apiClient } from "../auth/twitch.js";

export async function getM3u8Url(streamerName) {
  try {
    const user = await apiClient.users.getUserByName(streamerName);
    if (!user) return "offline";

    const stream = await apiClient.streams.getStreamByUserId(user.id);
    if (!stream) return "offline";

    const m3u8Url = `https://usher.ttvnw.net/api/channel/hls/${streamerName}.m3u8`;

    const { data } = await axios.get(m3u8Url);
    if (!data || !data.includes("#EXTM3U")) {
      return "offline"; // no valid playlist
    }

    return m3u8Url;
  } catch (err) {
    console.error("❌ Error fetching m3u8:", err.message);
    return null;
  }
}
