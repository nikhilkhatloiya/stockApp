import { Server } from "socket.io";

interface Stock {
  symbol: string;
  price: number;
}

let stocks: Stock[] = [
  { symbol: "AAPL", price: 180 },
  { symbol: "GOOG", price: 2800 },
  { symbol: "TSLA", price: 700 },
];

export function startPriceUpdates(io: Server) {
  setInterval(() => {
    stocks = stocks.map((s) => {
      // random fluctuation between -1% to +1%
      const change = (Math.random() - 0.5) * 2;
      s.price = +(s.price * (1 + change / 100)).toFixed(2);
      return s;
    });

    // emit to all connected clients
    io.emit("priceUpdate", stocks);
  }, 3000); // every 3s
}
