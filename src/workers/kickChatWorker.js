// src/workers/kickChatWorker.js
import { createClient } from "@retconned/kick-js";
import { clipQueue } from "../jobs/clipQueue.js";
import dotenv from "dotenv";

dotenv.config();

let kickConnection;

export const startKickMonitoring = (username) => {
  kickConnection = createClient(username, { logger: false, readOnly: true });

  kickConnection.on("ready", () => {
    console.log(`Kick monitoring → ${username}`);
  });

  kickConnection.on("message", (message) => {
    // Simple spike detection (count messages in 10s window)
    // You can use a more advanced system like your Twitch one
    const messageCount = 1;  // Increment counter here

    if (messageCount > 500) {  // Adjust threshold
      console.log(`KICK SPIKE → ${username} (${messageCount} msgs)`);
      clipQueue.add("clip", {
        platform: "kick",
        streamerLogin: username,
        title: `kick_spike_${Date.now()}`,
        duration: 90,
        spikeComments: messageCount,
        baselineComments: 10
      });
    }
  });

  kickConnection.on("error", (err) => {
    console.error("Kick chat error:", err.message);
  });

  kickConnection.connect();
};

export const stopKickMonitoring = () => {
  if (kickConnection) kickConnection.disconnect();
};