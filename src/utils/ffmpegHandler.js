import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";
import twitchM3U8 from "twitch-m3u8";
import youtubedl from "youtube-dl-exec";

ffmpeg.setFfmpegPath(ffmpegPath);

export const captureClip = async (url, outputDir, duration = 10) => {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, `clip-${Date.now()}.mp4`);

  let realUrl;

  // 🟣 Twitch (untouched)
  if (url.includes("twitch.tv")) {
    const username = url.split("twitch.tv/")[1].split(/[/?#]/)[0];
    console.log(`🎯 Getting real stream URL for Twitch user: ${username}`);
    const streams = await twitchM3U8.getStream(username);
    if (!streams || !streams.length) throw new Error(`No live Twitch stream found`);
    realUrl = streams[0].url;
  }

  // 🔴 YouTube
  else if (url.includes("youtube.com") || url.includes("youtu.be")) {
    console.log("🎯 Getting real stream URL for YouTube...");
    const info = await youtubedl(url, { dumpSingleJson: true });

    // 🧠 Accept multiple stream types (not only HLS)
    const formats = info.formats.filter(
      (f) =>
        f.protocol === "m3u8" ||
        f.url?.includes(".m3u8") ||
        f.url?.includes(".mp4") ||
        f.url?.includes(".mpd")
    );

    if (!formats.length) throw new Error("No playable format found for YouTube stream");

    // Choose best resolution
    const best = formats.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
    realUrl = best.url;
  }

  // 🟢 Kick
  else if (url.includes("kick.com")) {
    console.log("🎯 Getting real stream URL for Kick...");
    try {
      const info = await youtubedl(url, {
        dumpSingleJson: true,
        // Try browser impersonation if available
        exec: "yt-dlp --impersonate chrome",
      });

      const formats = info.formats.filter(
        (f) => f.protocol === "m3u8" || f.url?.includes(".m3u8")
      );
      if (!formats.length) throw new Error("No HLS format found for Kick stream");

      realUrl = formats[0].url;
    } catch (err) {
      console.error("⚠️ Kick impersonation may not be available:", err.message);
      throw new Error("Kick stream fetch failed — check yt-dlp impersonation setup");
    }
  }

  else {
    throw new Error("Unsupported platform — please use Twitch, YouTube, or Kick");
  }

  console.log(`✅ Found real stream: ${realUrl}`);
  console.log("🎬 Capturing clip...");

  return new Promise((resolve, reject) => {
    ffmpeg(realUrl)
      .setDuration(duration)
      .outputOptions(["-c copy"])
      .output(outputFile)
      .on("end", () => {
        console.log(`✅ Clip saved locally: ${outputFile}`);
        resolve(outputFile);
      })
      .on("error", (err) => {
        console.error("❌ FFmpeg error:", err.message);
        reject(err);
      })
      .run();
  });
};
