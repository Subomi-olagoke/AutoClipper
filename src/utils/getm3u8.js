// utils/getM3u8.js
import axios from "axios";
import qs from "qs";

let appToken = process.env.TWITCH_APP_TOKEN;
let tokenExpiry = 0;

async function getAppAccessToken() {
  const now = Date.now();
  if (appToken && tokenExpiry > now + 60000) return appToken; // still valid

  console.log("🔑 Requesting new App Access Token...");
  const resp = await axios.post(
    "https://id.twitch.tv/oauth2/token",
    qs.stringify({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  appToken = resp.data.access_token;
  tokenExpiry = now + resp.data.expires_in * 1000;
  console.log("✅ Got new App Access Token");
  return appToken;
}

export async function getM3u8Url(streamerLogin) {
  try {
    const token = await getAppAccessToken();

    // 1️⃣ Get user ID from login
    const userResp = await axios.get(
      `https://api.twitch.tv/helix/users?login=${streamerLogin}`,
      { headers: { "Client-ID": process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` } }
    );

    const user = userResp.data.data[0];
    if (!user) return "offline";

    // 2️⃣ Check if streamer is live
    const streamResp = await axios.get(
      `https://api.twitch.tv/helix/streams?user_id=${user.id}`,
      { headers: { "Client-ID": process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` } }
    );

    const stream = streamResp.data.data[0];
    if (!stream) return "offline";

    console.log("🔑 Fetching GQL playback token...");

    // 3️⃣ GraphQL request to get HLS token
    const gqlResp = await axios.post(
      "https://gql.twitch.tv/gql",
      [
        {
          operationName: "PlaybackAccessToken",
          variables: {
            isLive: true,
            login: streamerLogin,
            isVod: false,
            vodID: "",
            playerType: "embed",
          },
          extensions: { persistedQuery: { version: 1, sha256Hash: "0828119ded1c134d3786d8b8b26e9e0a3eb2c5d3c96b0fa0a3ec94a33f56b10b" } },
        },
      ],
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const playbackData = gqlResp.data[0].data.streamPlaybackAccessToken;
    const sig = playbackData.signature;
    const tokenStr = encodeURIComponent(playbackData.value);

    return `https://usher.ttvnw.net/api/channel/hls/${streamerLogin}.m3u8?sig=${sig}&token=${tokenStr}&allow_source=true&allow_audio_only=true`;
  } catch (err) {
    console.error("❌ Error fetching m3u8:", err.response?.data || err.message);
    return null;
  }
}
