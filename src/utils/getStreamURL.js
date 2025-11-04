import { spawnSync } from "child_process";

export const getStreamURL = (url, service) => {
  try {
    const args = [
      "--no-warnings",
      "--geo-bypass",
      "--rm-cache-dir",
      "--user-agent",
      "Mozilla/5.0",
      "--format",
      "best[protocol=m3u8]/best",
      "--get-url",
      url,
    ];

    const ytdlp = spawnSync("yt-dlp", args);
    const output = ytdlp.stdout.toString().trim();
    const error = ytdlp.stderr.toString().trim();

    if (error && !output) {
      console.error("yt-dlp error:", error);
      throw new Error(error);
    }

    if (!output) throw new Error("No playable HLS URL found.");

    console.log(`✅ Found HLS URL for ${service}`);
    return output;
  } catch (err) {
    console.error("❌ getStreamURL failed:", err.message);
    return null;
  }
};
