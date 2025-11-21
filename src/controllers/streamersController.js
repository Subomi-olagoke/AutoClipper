import { 
  startChatListener, 
  stopChatListener,
  getChatStats, 
  resetChatStats 
} from "../twitch/chatTracker.js";

import { clipQueue } from "../jobs/clipQueue.js";

const activeStreamers = new Map();  
// Map<streamerLogin, { intervalId }>

export async function startMonitoringStreamer(streamerLogin) {
  if (!streamerLogin) return { message: "streamerLogin required" };

  if (activeStreamers.has(streamerLogin)) {
    return { message: `Already monitoring ${streamerLogin}` };
  }

  console.log(`🎧 Starting monitoring for ${streamerLogin}`);

  // Start chat listener
  await startChatListener(streamerLogin);

  // Create interval
  // In your startMonitoringStreamer interval (replace the old interval)
const intervalId = setInterval(() => {
  const stats = getChatStats(streamerLogin);
  if (!stats) return;

  console.log(`${streamerLogin}: ${stats.count}/${stats.baseline}`);

  // SPIKE: 1500+ messages in the last 15s window
  if (stats.count >= 1500) {  
    console.log(`MASSIVE SPIKE DETECTED → ${streamerLogin} (${stats.count} msgs)`);

    clipQueue.add("autoClip", {
      streamerLogin,
      title: `${streamerLogin}_spike_${Date.now()}`,
      duration: 90,           // ← 90 seconds
      spikeComments: stats.count,
      baselineComments: stats.baseline,
    });

    // Optional: Emit live alert to frontend
    if (global.io) {
      global.io.emit("spike-alert", {
        streamer: streamerLogin,
        messages: stats.count,
        time: new Date().toLocaleString(),
      });
    }

    resetChatStats(streamerLogin);
  }
}, 15000);

  // Store interval ID
  activeStreamers.set(streamerLogin, { intervalId });

  return { message: `Started monitoring ${streamerLogin}` };
}

export function stopMonitoringStreamer(streamerLogin) {
  const streamer = activeStreamers.get(streamerLogin);

  if (!streamer) {
    return { message: `${streamerLogin} is not being monitored` };
  }

  // Stop the interval
  clearInterval(streamer.intervalId);

  // Stop chat listener
  stopChatListener(streamerLogin);

  // Remove from map
  activeStreamers.delete(streamerLogin);

  console.log(`🛑 Stopped monitoring ${streamerLogin}`);

  return { message: `Stopped monitoring ${streamerLogin}` };
}

export function getStreamers(req, res) {
  const streamers = Array.from(activeStreamers.keys());
  res.json({ streamers });
}
