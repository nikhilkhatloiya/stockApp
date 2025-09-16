"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export function useSocket() {
  const [prices, setPrices] = useState<unknown[]>([]);

  useEffect(() => {
    // connect to backend
    socket = io("http://localhost:4000");

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket:", socket.id);
    });

    socket.on("priceUpdate", (data) => {
      setPrices(data);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });

    // ✅ cleanup function must be a function returning void
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return prices;
}
