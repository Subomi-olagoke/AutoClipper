import { startChatListener, getChatStats, resetChatStats } from "../twitch/chatTracker.js";
import { clipQueue } from "../jobs/clipQueue.js";
import Streamer from "../models/streamerModel.js";

const activeStreamers = new Map();

export async function startMonitoringStreamer(streamerLogin) {
  if (!streamerLogin) return { message: "streamerLogin required" };

  if (activeStreamers.has(streamerLogin)) {
    return { message: `Already monitoring ${streamerLogin}` };
  }

  console.log(`🎧 Starting monitoring for ${streamerLogin}`);

  await startChatListener(streamerLogin);
  activeStreamers.set(streamerLogin, true);

  setInterval(() => {
    const stats = getChatStats(streamerLogin);

    console.log(`📊 ${streamerLogin}: ${stats.count}/${stats.baseline}`);

    // spike threshold = 5x baseline
    if (stats.count >= stats.baseline * 5) {
      console.log(`🔥 Spike detected for ${streamerLogin}`);

      clipQueue.add("autoClip", {
        streamerLogin,
        spikeComments: stats.count,
        baselineComments: stats.baseline,
        duration: 15,
      });

      resetChatStats(streamerLogin);  // 🔥 RESET AFTER CLIP
    }
  }, 15000);

  return { message: `Started monitoring ${streamerLogin}` };
}

// Stop monitoring a streamer
export function stopMonitoringStreamer(streamerLogin) {
  if (!activeStreamers.has(streamerLogin)) {
    return { message: `${streamerLogin} is not being monitored` };
  }

  activeStreamers.delete(streamerLogin);
  console.log(`🛑 Stopped monitoring ${streamerLogin}`);
  return { message: `Stopped monitoring ${streamerLogin}` };
}

export function getStreamers(req, res) {
  // Example: list active streamers
  const streamers = Array.from(activeStreamers.keys());
  res.json({ streamers });
}

