import express from "express";
const router = express.Router();

let commentCount = 0;
let baselineComments = 10; // baseline for simulation
const streamUrl = "https://www.twitch.tv/loeya"; // example stream

router.get("/spike", (req, res) => {
  commentCount += Math.floor(Math.random() * 20); // simulate incoming comments

  res.json({
    currentComments: commentCount,
    baselineComments,
    streamUrl,
  });
});

export default router;
