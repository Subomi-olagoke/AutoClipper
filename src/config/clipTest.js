// clipTest.js
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

ffmpeg("test.mp4")
  .setStartTime("00:00:05")
  .setDuration(10)
  .output("output.mp4")
  .on("start", cmd => console.log("🎬 Running:", cmd))
  .on("end", () => console.log("✅ Done clipping!"))
  .on("error", err => console.error("❌ Error:", err.message))
  .run();
