import "./../config/db.js";    // ensure Mongoose connected if needed
import "./../config/redis.js"; // ensure redis connected
import { clipQueue } from "./clipQueue.js";

// keep process alive
console.log("🎧 Clip worker started");
clipQueue.on("completed", (job, result) => {
  console.log("Job completed", job.id);
});
