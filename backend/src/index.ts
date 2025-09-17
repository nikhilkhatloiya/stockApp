import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import { startPriceUpdates, shutdownPriceUpdates } from "./utils/priceUpdater";
import connectDB from "./config/db";
import userRoutes from "./routes/userRoutes";
import stockRoutes from "./routes/stockRoutes";
import portfolioRoutes from "./routes/portfolioRoutes";

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Connect to database
connectDB();

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/portfolio", portfolioRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    memory: process.memoryUsage(),
  });
});

let server: any = null;
let io: any = null;

async function startServer() {
  server = createServer(app);

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = parseInt(process.env.PORT || "4000");

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    startPriceUpdates(io);
  });
}

process.on("SIGTERM", () => shutdownPriceUpdates());
process.on("SIGINT", () => shutdownPriceUpdates());

startServer();
