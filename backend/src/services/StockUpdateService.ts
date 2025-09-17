import axios from "axios";
import { Server } from "socket.io";

class StockUpdateService {
  private io: Server | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly symbols = ["AAPL", "TSLA", "MSFT", "GOOG"]; // ✅ your watchlist
  private readonly API_KEY = process.env.FINNHUB_API_KEY;

  setSocketServer(io: Server) {
    this.io = io;
  }

  async fetchStockQuote(symbol: string) {
    if (!this.API_KEY) {
      throw new Error("Missing FINNHUB_API_KEY");
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.API_KEY}`;
    const res = await axios.get(url);
    return {
      symbol,
      price: res.data.c,
      change: res.data.d,
      changePercent: res.data.dp,
      high: res.data.h,
      low: res.data.l,
      open: res.data.o,
      previousClose: res.data.pc,
      lastUpdated: new Date().toISOString(),
    };
  }

  start() {
    if (!this.io) {
      console.error("❌ Socket.IO server not set!");
      return;
    }
    if (this.intervalId) {
      console.log("⏳ Stock updates already running");
      return;
    }

    console.log("🚀 Starting real-time stock updates...");

    this.intervalId = setInterval(async () => {
      try {
        const updates = await Promise.all(this.symbols.map((s) => this.fetchStockQuote(s)));
        this.io?.emit("priceUpdate", updates); // 🔥 broadcast to all clients
        console.log("📊 Broadcasted stock updates:", updates.map((u) => u.symbol).join(", "));
      } catch (err) {
        console.error("❌ Error fetching stock data:", err);
      }
    }, 5000); // every 5 seconds
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🛑 Stopped stock updates");
    }
  }
}

export default new StockUpdateService();
