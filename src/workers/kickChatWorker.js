// src/workers/kickChatWorker.js
import { createClient } from "@retconned/kick-js";
import { clipQueue } from "../jobs/clipQueue.js";

let kickConnection;

export const startKickMonitoring = (username) => {
  kickConnection = createClient(username, { logger: false, readOnly: true });

  kickConnection.on("ready", () => {
    console.log(`Kick monitoring → ${username}`);
  });

  kickConnection.on("message", (messageData) => {
    // Spike detection (add your counter)
    const messageCount = 1; // Increment global counter here

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

  kickConnection.on("error", (err) => {
    console.error("Kick chat error:", err.message);
    kickConnection.connect(); // Auto-reconnect
  });

  kickConnection.login(); // No credentials needed for read-only
};

export const stopKickMonitoring = () => kickConnection && kickConnection.logout();