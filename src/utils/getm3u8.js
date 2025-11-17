import { apiClient, authProvider } from "../auth/twitch.js";

export async function getM3u8Url(streamerName) {
  const user = await apiClient.users.getUserByName(streamerName);
  if (!user) return "offline";

  const stream = await apiClient.streams.getStreamByUserId(user.id);
  if (!stream) return "offline";

  const accessToken = await authProvider.getAccessToken(["user:read:follows"]);

  return `https://usher.ttvnw.net/api/channel/hls/${streamerName}.m3u8?token=${accessToken.accessToken}`;
}
