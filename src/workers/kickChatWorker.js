// src/workers/kickChatWorker.js
import { WebSocketConnection, MessageEvents } from "kick_live_ws";
import { clipQueue } from "../jobs/clipQueue.js";

let kickConnection = null;
let messageCount = 0;
let resetInterval;

export const startKickMonitoring = (username) => {
  if (kickConnection) {
    console.log(`✅ Kick monitoring already running for ${username}`);
    return;
  }

  console.log(`🔄 Connecting to Kick chat for ${username}...`);

  kickConnection = new WebSocketConnection({ name: username });
  kickConnection.connect();

  kickConnection.on(MessageEvents.CHATMESSAGE, (data) => {
    messageCount++;
    if (messageCount > 50) {  // Adjust spike threshold
      console.log(`🔥 KICK SPIKE DETECTED → ${username} (${messageCount} messages)! Triggering clip...`);
      clipQueue.add("clip", {
        platform: "kick",
        streamerLogin: username,
        title: `kick_spike_${Date.now()}`,
        duration: 90,
        spikeComments: messageCount,
      });
      messageCount = 0;
    }
  });

  resetInterval = setInterval(() => { messageCount = 0; }, 30000);

  console.log(`✅ Kick chat connected → Monitoring ${username}`);
};

export const stopKickMonitoring = () => {
  if (kickConnection) {
    kickConnection.disconnect();
    kickConnection = null;
    clearInterval(resetInterval);
    console.log("🛑 Kick monitoring stopped");
  }
};