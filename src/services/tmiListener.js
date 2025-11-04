import tmi from "tmi.js";
import { pushMessage } from "./spikeService.js";
import { TWITCH_BOT_USERNAME, TWITCH_BOT_OAUTH } from "../config/env.js"; // env helper

let client;

/**
 * joinChannels: array of channel names (without #)
 */
export const startTmiListener = (joinChannels = []) => {
  if (!TWITCH_BOT_OAUTH || !TWITCH_BOT_USERNAME) {
    console.warn("TMI credentials not set; tmi not started.");
    return;
  }
  client = new tmi.Client({
    options: { debug: false },
    identity: {
      username: TWITCH_BOT_USERNAME,
      password: TWITCH_BOT_OAUTH // oauth:prefix 'oauth:...'
    },
    channels: joinChannels,
  });

  client.on("message", async (channel, tags, message, self) => {
    try {
      // channel has form '#channelname'
      const name = channel.replace("#", "");
      // push timestamp to redis
      await pushMessage(name, Date.now());
    } catch (err) {
      console.error("tmi message handler error:", err);
    }
  });

  client.on("connected", (addr, port) => {
    console.log("✅ TMI connected", addr, port);
  });

  client.connect().catch(err => console.error("TMI connect error:", err));
};

export const joinChannel = async (channel) => {
  if (!client) throw new Error("TMI client not started");
  await client.join(channel);
  console.log("Joined", channel);
};
