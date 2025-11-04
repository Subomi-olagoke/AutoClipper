import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import clipRoutes from "./routes/clipsRoutes.js";



dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/clips", clipRoutes);

app.get("/", (req, res) => {
  res.send("🎬 AutoClipper API is running...");
});

export default app;
