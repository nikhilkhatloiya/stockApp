import { Server } from "socket.io";
import stockDataService from "../services/stockDataService";
import changeStreamService from "../services/changeStreamService";
import Stock from "../models/Stock";

interface PriceUpdateManager {
  isRunning: boolean;
  intervals: NodeJS.Timeout[];
  useMockData: boolean;
}

const priceUpdateManager: PriceUpdateManager = {
  isRunning: false,
  intervals: [],
  useMockData: false,
};

// Get tracked symbols from environment or default list
function getTrackedSymbols(): string[] {
  const envSymbols = process.env.TRACKED_SYMBOLS;
  if (envSymbols) {
    return envSymbols.split(",").map((s) => s.trim().toUpperCase());
  }
  return ["AAPL", "GOOGL", "TSLA", "MSFT", "AMZN", "META", "NVDA", "NFLX"];
}

// Initialize stocks in DB if missing
async function initializeStocks() {
  try {
    const symbols = getTrackedSymbols();
    const existingStocks = await Stock.find({ symbol: { $in: symbols } });
    const existingSymbols = new Set(existingStocks.map((s) => s.symbol));
    const missingSymbols = symbols.filter((s) => !existingSymbols.has(s));

    if (missingSymbols.length > 0) {
      console.log(`🆕 Initializing stocks: ${missingSymbols.join(", ")}`);
      const hasApiKeys = stockDataService["providers"]?.length > 0;
      if (hasApiKeys) {
        try {
          const quotes = await stockDataService.fetchMultipleQuotes(missingSymbols);
          await stockDataService.updateMultipleStocksInDatabase(quotes);
          console.log(`✅ Initialized ${quotes.length} stocks with real data`);
        } catch (error) {
          console.log("⚠️ Failed to fetch real data, using mock data");
          await initializeWithMockData(missingSymbols);
        }
      } else {
        console.log("⚠️ No API keys configured, using mock data");
        await initializeWithMockData(missingSymbols);
      }
    }

    console.log(`📊 Total active stocks: ${await Stock.countDocuments({ isActive: true })}`);
  } catch (error) {
    console.error("❌ Error initializing stocks:", error);
  }
}

// Initialize missing stocks with mock data
async function initializeWithMockData(symbols: string[]) {
  try {
    const mockStocks = symbols.map((symbol) => {
      const mockQuote = stockDataService.generateMockQuote(symbol);
      return new Stock({
        ...mockQuote,
        lastUpdated: new Date(),
        history: [{ price: mockQuote.price, timestamp: new Date() }],
      });
    });
    await Stock.insertMany(mockStocks);
    console.log(`📝 Initialized ${mockStocks.length} stocks with mock data`);
  } catch (error) {
    console.error("❌ Error initializing mock stocks:", error);
  }
}

// Update stock prices (real or mock)
async function updateStockPrices(useMockData = false) {
  const symbols = getTrackedSymbols();
  try {
    if (useMockData) {
      // Mock price updates
      const stocks = await Stock.find({ symbol: { $in: symbols }, isActive: true });
      for (const stock of stocks) {
        const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
        const newPrice = stock.price * (1 + changePercent / 100);
        const change = newPrice - stock.previousClose;

        Object.assign(stock, {
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          volume: Math.floor(Math.random() * 10000000) + 100000,
          dayHigh: Math.max(stock.dayHigh, newPrice),
          dayLow: Math.min(stock.dayLow, newPrice),
          lastUpdated: new Date(),
        });

        // Add to history
        if (stock.price !== newPrice) {
          stock.history.push({ price: newPrice, timestamp: new Date() });
          if (stock.history.length > 100) stock.history = stock.history.slice(-100);
        }

        await stock.save();
      }

      console.log(`🎲 Updated ${stocks.length} stocks with mock data`);
    } else {
      // Real API updates
      try {
        const quotes = await stockDataService.fetchMultipleQuotes(symbols);
        if (quotes.length > 0) {
          await stockDataService.updateMultipleStocksInDatabase(quotes);
          console.log(`📈 Updated ${quotes.length} stocks with real data`);
        } else {
          console.log("⚠️ No real data received, using mock data fallback");
          await updateStockPrices(true);
        }
      } catch (error) {
        console.error("❌ Real data update failed, using mock data fallback:", (error as Error).message);
        await updateStockPrices(true);
      }
    }
  } catch (error) {
    console.error("❌ Error updating stock prices:", error);
  }
}

// Start price updates
export async function startPriceUpdates(io: Server) {
  if (priceUpdateManager.isRunning) {
    console.log("⚠️ Price updates already running");
    return;
  }

  try {
    // Set socket in change stream service
    changeStreamService.setSocketServer(io);
    await changeStreamService.startWatching();

    // Initialize DB
    await initializeStocks();

    const priceUpdateInterval = parseInt(process.env.PRICE_UPDATE_INTERVAL || "30000"); // 30s
    const databaseSyncInterval = parseInt(process.env.DATABASE_SYNC_INTERVAL || "60000"); // 60s
    const hasApiKeys = stockDataService["providers"]?.length > 0;
    priceUpdateManager.useMockData = !hasApiKeys;

    if (!hasApiKeys) {
      console.log("⚠️ No API keys configured. Using mock data mode.");
      console.log("💡 To use real data, configure API keys in .env file");
    }

    // Broadcast initial prices
    await changeStreamService.broadcastCurrentPrices();

    // Price update interval
    const priceInterval = setInterval(async () => {
      await updateStockPrices(priceUpdateManager.useMockData);
    }, priceUpdateInterval);

    // Broadcast current prices interval
    const syncInterval = setInterval(async () => {
      const stocks = await Stock.find({ isActive: true });
      io.emit("stockData", stocks.map((s) => s.toObject()));
    }, databaseSyncInterval);

    priceUpdateManager.intervals.push(priceInterval, syncInterval);
    priceUpdateManager.isRunning = true;

    console.log(`🚀 Price updates started:
   📊 Update interval: ${priceUpdateInterval / 1000}s
   🔄 Sync interval: ${databaseSyncInterval / 1000}s
   ${hasApiKeys ? "🌐 Real-time data" : "🎲 Mock data"} mode`);

    // Handle client connections
    io.on("connection", (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      changeStreamService.handleClientConnection(socket);
      socket.on("disconnect", () => console.log(`🔌 Client disconnected: ${socket.id}`));
    });
  } catch (error) {
    console.error("❌ Failed to start price updates:", error);
    fallbackPriceUpdates(io);
  }
}

// Fallback mock updates
function fallbackPriceUpdates(io: Server) {
  console.log("🔄 Starting fallback price updates...");
  const mockStocks = ["AAPL", "GOOGL", "TSLA"].map((symbol) =>
    stockDataService.generateMockQuote(symbol)
  );

  const fallbackInterval = setInterval(() => {
    const updatedStocks = mockStocks.map((s) => {
      const change = (Math.random() - 0.5) * 2;
      const newPrice = +(s.price * (1 + change / 100)).toFixed(2);
      const priceChange = newPrice - s.price;
      s.price = newPrice;

      return {
        ...s,
        price: newPrice,
        change: +priceChange.toFixed(2),
        changePercent: +((priceChange / s.price) * 100).toFixed(2),
        lastUpdated: new Date(),
      };
    });

    io.emit("stockData", updatedStocks);
    console.log(
      `📊 Fallback update: ${updatedStocks.map((s) => `${s.symbol}: $${s.price}`).join(", ")}`
    );
  }, 5000);

  priceUpdateManager.intervals.push(fallbackInterval);
  priceUpdateManager.isRunning = true;
}

// Stop price updates
export function stopPriceUpdates() {
  if (!priceUpdateManager.isRunning) return;

  console.log("⏹️ Stopping price updates...");
  priceUpdateManager.intervals.forEach(clearInterval);
  priceUpdateManager.intervals = [];
  changeStreamService.stopWatching();
  priceUpdateManager.isRunning = false;
  console.log("✅ Price updates stopped");
}

// Shutdown gracefully
export async function shutdownPriceUpdates() {
  console.log("🛑 Shutting down price update system...");
  stopPriceUpdates();
  await changeStreamService.shutdown();
  console.log("✅ Price update system shutdown complete");
}
