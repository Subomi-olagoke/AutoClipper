// src/workers/youtubeChatWorker.js
import { google } from "googleapis";
import { clipQueue } from "../jobs/clipQueue.js";
import dotenv from "dotenv";

dotenv.config();

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY  // Your free Google API key
});

let pollingInterval;

async function monitorYouTubeChat(channelId) {
  try {
    // Step 1: Get live stream ID
    const streams = await youtube.search.list({
      part: "liveStreamingDetails",
      channelId,
      type: "video",
      eventType: "live"
    });

    const liveStream = streams.data.items[0];
    if (!liveStream) {
      console.log("No live stream found for channel");
      return;
    }

    const videoId = liveStream.id.videoId;
    console.log(`Monitoring YouTube → ${videoId}`);

    // Step 2: Get live chat ID
    const videoDetails = await youtube.videos.list({
      part: "liveStreamingDetails",
      id: videoId
    });

    const liveChatId = videoDetails.data.items[0].liveStreamingDetails.activeLiveChatId;
    if (!liveChatId) {
      console.log("No active chat found");
      return;
    }

    let messageCount = 0;
    let baseline = 50;  // Adjust as needed

    // Step 3: Poll chat every 5 seconds
    pollingInterval = setInterval(async () => {
      const response = await youtube.liveChatMessages.list({
        liveChatId,
        part: "snippet,authorDetails",
        maxResults: 200  // Get recent messages
      });

      const recentMessages = response.data.items.length;
      messageCount += recentMessages;

      // Spike detection (10x baseline in 10 seconds)
      if (messageCount > baseline * 10) {
        console.log(`YOUTUBE SPIKE → ${channelId} (${messageCount} msgs)`);
        await clipQueue.add("clip", {
          platform: "youtube",
          streamerLogin: videoId,
          title: `youtube_spike_${Date.now()}`,
          duration: 90,
          spikeComments: messageCount,
          baselineComments: baseline
        });
        messageCount = 0;  // Reset
      }

      console.log(`YouTube chat: ${recentMessages} msgs/sec`);
    }, 5000);  // Poll every 5s

  } catch (err) {
    console.error("YouTube chat error:", err.message);
    clearInterval(pollingInterval);
  }
}

// Start monitoring for a channel
export const startYouTubeMonitoring = (channelId) => monitorYouTubeChat(channelId);

// Stop monitoring
export const stopYouTubeMonitoring = () => clearInterval(pollingInterval);