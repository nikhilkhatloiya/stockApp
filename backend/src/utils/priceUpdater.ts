import { Server } from "socket.io";
import stockDataService from "../services/stockDataService";

interface PriceUpdateManager {
  isRunning: boolean;
  intervals: NodeJS.Timeout[];
}

const priceUpdateManager: PriceUpdateManager = {
  isRunning: false,
  intervals: [],
};

// Get tracked symbols from environment or default list
function getTrackedSymbols(): string[] {
  const envSymbols = process.env.TRACKED_SYMBOLS;
  if (envSymbols) {
    return envSymbols.split(",").map((s) => s.trim().toUpperCase());
  }
  return ["AAPL", "GOOGL", "TSLA", "MSFT", "AMZN", "META", "NVDA", "NFLX"];
}

// Update stock prices (API only, no DB)
async function updateStockPrices(io: Server) {
  const symbols = getTrackedSymbols();
  try {
    console.log(`🔄 Fetching real data for: ${symbols.join(", ")}`);
    const quotes = await stockDataService.fetchMultipleQuotes(symbols);
    if (quotes.length > 0) {
      io.emit("priceUpdate", quotes); // 🔥 Directly send to clients
      console.log(`📈 Sent ${quotes.length} stock updates to clients`);
    } else {
      console.log("⚠️ No real data received from API");
    }
  } catch (error) {
    console.error("❌ Real data update failed:", (error as Error).message);
  }
}

// Start price updates
export async function startPriceUpdates(io: Server) {
  if (priceUpdateManager.isRunning) {
    console.log("⚠️ Price updates already running");
    return;
  }

  const priceUpdateInterval = parseInt(process.env.PRICE_UPDATE_INTERVAL || "30000"); // 30s

  console.log("✅ Starting real-time price updates (API only mode)");

  // Initial push
  await updateStockPrices(io);

  // Interval push
  const priceInterval = setInterval(async () => {
    await updateStockPrices(io);
  }, priceUpdateInterval);

  priceUpdateManager.intervals.push(priceInterval);
  priceUpdateManager.isRunning = true;

  console.log(`🚀 Price updates started: every ${priceUpdateInterval / 1000}s`);

  // Handle client connections
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send initial stock data
    updateStockPrices(io);

    socket.on("disconnect", () =>
      console.log(`🔌 Client disconnected: ${socket.id}`)
    );
  });
}

// Stop price updates
export function stopPriceUpdates() {
  if (!priceUpdateManager.isRunning) return;

  console.log("⏹️ Stopping price updates...");
  priceUpdateManager.intervals.forEach(clearInterval);
  priceUpdateManager.intervals = [];
  priceUpdateManager.isRunning = false;
  console.log("✅ Price updates stopped");
}

// Shutdown gracefully
export async function shutdownPriceUpdates() {
  console.log("🛑 Shutting down price update system...");
  stopPriceUpdates();
  console.log("✅ Price update system shutdown complete");
}
