import { io } from "socket.io-client";

// Connect to your backend WebSocket server
const socket = io("http://localhost:4000");

// Runs when connected
socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);
});

// Runs whenever server emits stock updates
socket.on("priceUpdate", (data) => {
  console.log("📈 Stock Prices:", data);
});

// Runs when connection closes
socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});
