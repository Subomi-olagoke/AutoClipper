import axios from "axios";
import { apiClient } from "../auth/twitch.js";

export async function getM3u8Url(streamerName) {
  const user = await apiClient.users.getUserByName(streamerName);
  if (!user) return "offline";

  const stream = await apiClient.streams.getStreamByUserId(user.id);
  if (!stream) return "offline";

  const { data } = await axios.get(
    `https://api.twitch.tv/api/channels/${streamerName}/access_token`,
    {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        "Accept": "application/vnd.twitchtv.v5+json",
      },
    }
  );

  const sig = data.sig;
  const token = data.token;

  return `https://usher.ttvnw.net/api/channel/hls/${streamerName}.m3u8?sig=${sig}&token=${token}&allow_source=true`;
}

