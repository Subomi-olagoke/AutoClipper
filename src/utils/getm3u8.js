// utils/getM3u8.js
import axios from "axios";

export async function getM3u8Url(streamerLogin) {
  try {
    // 1. Get token (App or User — use from twitchtokengenerator.com if you have scopes)
    const tokenType = process.env.TWITCH_TOKEN_TYPE || 'app'; // 'app' or 'user'
    const token = tokenType === 'user' ? process.env.TWITCH_USER_ACCESS_TOKEN : await getAppAccessToken();
    const authHeader = tokenType === 'user' ? `OAuth ${token}` : `Bearer ${token}`;

    const helixHeaders = {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: authHeader,
    };

    // 2. Check live status
    const streamRes = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${streamerLogin.toLowerCase()}`, { headers: helixHeaders });
    if (!streamRes.data.data?.[0]) return "offline";

    console.log(`Streamer ${streamerLogin} is LIVE! Fetching playback token...`);

    // 3. GQL — NO token here, just official Client-ID
    const gqlRes = await axios.post("https://gql.twitch.tv/gql", {
      operationName: "PlaybackAccessToken",
      variables: { isLive: true, login: streamerLogin.toLowerCase(), isVod: false, vodID: "", playerType: "embed" },
      extensions: {
        persistedQuery: { version: 1, sha256Hash: "0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712" }
      }
    }, {
      headers: {
        "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",  // Fixed: No auth
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.twitch.tv/directory/following"
      }
    });

    console.log("GQL Response:", JSON.stringify(gqlRes.data, null, 2));

    if (gqlRes.data.errors) throw new Error(`GQL Errors: ${JSON.stringify(gqlRes.data.errors)}`);

    const { value, signature } = gqlRes.data.data.streamPlaybackAccessToken;
    if (!value || !signature) throw new Error("No playback token");

    // 4. Build m3u8
    const m3u8 = `https://usher.ttvnw.net/api/channel/hls/${streamerLogin.toLowerCase()}.m3u8?sig=${signature}&token=${encodeURIComponent(value)}&allow_source=true&allow_audio_only=true&player=twitchweb&p=${Math.floor(Math.random() * 9999999)}`;

    console.log("m3u8 ready!");
    return m3u8;

  } catch (err) {
    console.error("m3u8 error:", err.message);
    return null;
  }
}

// App token fallback (if not using user token from site)
let cachedAppToken = null;
let expiry = 0;
async function getAppAccessToken() {
  if (cachedAppToken && Date.now() < expiry) return cachedAppToken;
  const res = await axios.post("https://id.twitch.tv/oauth2/token", new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials"
  }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  cachedAppToken = res.data.access_token;
  expiry = Date.now() + res.data.expires_in * 1000 - 60000;
  return cachedAppToken;
}