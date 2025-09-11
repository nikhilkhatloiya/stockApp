import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export function useSocket() {
  const [prices, setPrices] = useState<{ symbol: string; price: string }[]>([]);

  useEffect(() => {
    socket = io("http://localhost:4000"); // backend port

    socket.on("connect", () => console.log("✅ Connected:", socket.id));

    socket.on("priceUpdate", (data) => {
      setPrices(data);
    });

    socket.on("disconnect", () => console.log("❌ Disconnected"));

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return prices;
}
