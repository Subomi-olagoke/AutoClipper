// src/workers/kickChatWorker.js
import { KickChat } from "kick-chat-api";
import { clipQueue } from "../jobs/clipQueue.js";

let kickChat;

export const startKickMonitoring = (username) => {
  kickChat = new KickChat(username);

  kickChat.on("message", (msg) => {
    // Spike detection (add your counter logic)
    const messageCount = 1; // Increment global counter

    if (messageCount > 50) {
      console.log(`KICK SPIKE → ${username} (${messageCount})`);
      clipQueue.add("clip", {
        platform: "kick",
        streamerLogin: username,
        title: `kick_spike_${Date.now()}`,
        duration: 90,
        spikeComments: messageCount
      });
    }
  });

  kickChat.connect();
  console.log(`Kick monitoring → ${username}`);
};

export const stopKickMonitoring = () => kickChat && kickChat.disconnect();