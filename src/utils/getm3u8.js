import axios from "axios";

export async function getM3u8Url(streamerLogin) {
  try {
    console.log("🔑 Fetching GQL playback token...");

    const payload = [
      {
        operationName: "PlaybackAccessToken",
        query: `query PlaybackAccessToken($login: String!, $isLive: Boolean!, $vodID: ID!, $playerType: String!) {
          streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) {
            value
            signature
            __typename
          }
        }`,
        variables: {
          login: streamerLogin,
          isLive: true,
          vodID: "",
          playerType: "site"
        }
      }
    ];

    const { data } = await axios.post("https://gql.twitch.tv/gql", payload, {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,      // Use App Client-ID
        "Authorization": `Bearer ${process.env.TWITCH_APP_TOKEN}`, // App Token
        "Content-Type": "application/json",
      },
    });

    const tokenData = data[0]?.data?.streamPlaybackAccessToken;
    if (!tokenData) return "offline";

    const { value: token, signature: sig } = tokenData;

    return `https://usher.ttvnw.net/api/channel/hls/${streamerLogin}.m3u8?sig=${sig}&token=${encodeURIComponent(token)}&allow_source=true`;
  } catch (err) {
    console.error("❌ Error fetching m3u8:", err.message);
    return null;
  }
}
