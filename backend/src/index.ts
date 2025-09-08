import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db";
import { startPriceUpdates } from "./utils/priceUpdater";

import stockRoutes from "./routes/stockRoutes";
import userRoutes from "./routes/userRoutes";
import portfolioRoutes from "./routes/portfolioRoutes";

dotenv.config();
connectDB();


const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API is running"));

app.use("/api/stocks", stockRoutes);
app.use("/api/users", userRoutes);
app.use("/api/portfolio", portfolioRoutes);

// Create HTTP server
const server = createServer(app);

// Setup WebSocket
const io = new Server(server, {
  cors: {
    origin: "*", // allow all (for now)
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

startPriceUpdates(io);


  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
