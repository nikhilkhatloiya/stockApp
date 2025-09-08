import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export function useSocket() {
  const [prices, setPrices] = useState<any[]>([]);

  useEffect(() => {
    socket = io("http://localhost:5000"); // backend URL

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket:", socket.id);
    });

    socket.on("priceUpdate", (data) => {
      console.log("📈 Received:", data);
      setPrices(data);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return prices;
}
