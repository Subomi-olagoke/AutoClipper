// utils/getM3u8.js
import axios from "axios";

export async function getM3u8Url(streamerLogin) {
  try {
    // 1️⃣ Check if streamer exists and get user ID (using your own app Client-ID + App Token)
    const helixHeaders = {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      "Authorization": `Bearer ${await getAppAccessToken()}`,
    };

    const userResp = await axios.get(
      `https://api.twitch.tv/helix/users?login=${streamerLogin.toLowerCase()}`,
      { headers: helixHeaders, timeout: 8000 }
    );

    if (!userResp.data.data || userResp.data.data.length === 0) {
      console.log(`Streamer ${streamerLogin} not found.`);
      return "offline";
    }

    const userId = userResp.data.data[0].id;

    // 2️⃣ Check if actually live
    const streamResp = await axios.get(
      `https://api.twitch.tv/helix/streams?user_id=${userId}`,
      { headers: helixHeaders, timeout: 8000 }
    );

    if (!streamResp.data.data || streamResp.data.data.length === 0) {
      console.log(`Streamer ${streamerLogin} is offline.`);
      return "offline";
    }

    console.log(`Streamer ${streamerLogin} is LIVE! Fetching m3u8...`);

    // 3️⃣ GQL request — MUST use the official web Client-ID (kimne78...) in 2025
    const gqlResp = await axios.post(
      "https://gql.twitch.tv/gql",
      {
        operationName: "PlaybackAccessToken",
        variables: {
          isLive: true,
          login: streamerLogin.toLowerCase(),
          isVod: false,
          vodID: "",
          playerType: "embed"
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: "0828119ded1c134d3786d8b8b26e9e0a3eb2c5d3c96b0fa0a3ec94a33f56b10b"
          }
        }
      },
      {
        headers: {
          "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko", // This one WORKS in 2025
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Referer": "https://twitch.tv/",
          "Origin": "https://twitch.tv"
        },
        timeout: 10000
      }
    );

    const { value, signature } = gqlResp.data.data.streamPlaybackAccessToken;

    const m3u8 = `https://usher.ttvnw.net/api/channel/hls/${streamerLogin.toLowerCase()}.m3u8` +
      `?sig=${signature}` +
      `&token=${encodeURIComponent(value)}` +
      `&allow_source=true` +
      `&allow_audio_only=true` +
      `&p=${Math.floor(Math.random() * 9999999)}`;

    console.log(`m3u8 URL ready for ${streamerLogin}`);
    return m3u8;

  } catch (err) {
    console.error("Error fetching m3u8:", err.response?.data || err.message);
    return null;
  }
}

// Helper: Get valid App Access Token (cached)
let cachedAppToken = null;
let tokenExpiry = 0;

async function getAppAccessToken() {
  if (cachedAppToken && Date.now() < tokenExpiry) {
    return cachedAppToken;
  }

  try {
    console.log("Requesting new App Access Token...");
    const resp = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials"
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    cachedAppToken = resp.data.access_token;
    tokenExpiry = Date.now() + (resp.data.expires_in || 3600) * 1000 - 60000;
    console.log("Got new App Access Token");
    return cachedAppToken;
  } catch (err) {
    console.error("Failed to get App Token:", err.response?.data || err.message);
    throw err;
  }
}