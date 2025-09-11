import { Router } from "express";
import mongoose from "mongoose";
import Stock from "../models/Stock";

const router = Router();

// Mock data fallback when database is not connected
const mockStocks = [
  { 
    _id: "1",
    symbol: "AAPL", 
    name: "Apple Inc.", 
    price: 180.50, 
    change: 2.5,
    changePercent: 1.41,
    history: [175, 176, 178, 180.50] 
  },
  { 
    _id: "2",
    symbol: "GOOG", 
    name: "Alphabet Inc.", 
    price: 2800.25, 
    change: -15.30,
    changePercent: -0.54,
    history: [2750, 2775, 2790, 2800.25] 
  },
  { 
    _id: "3",
    symbol: "MSFT", 
    name: "Microsoft Corp.", 
    price: 320.75, 
    change: 8.20,
    changePercent: 2.62,
    history: [310, 312, 315, 320.75] 
  },
  { 
    _id: "4",
    symbol: "TSLA", 
    name: "Tesla Inc.", 
    price: 698.40, 
    change: -12.60,
    changePercent: -1.77,
    history: [680, 690, 695, 698.40] 
  }
];

// Helper function to check database connection
const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

// GET all stocks
router.get("/", async (req, res) => {
  try {
    if (isDatabaseConnected()) {
      const stocks = await Stock.find({});
      res.json(stocks);
    } else {
      console.log("📊 Using mock stock data (database not connected)");
      res.json(mockStocks);
    }
  } catch (error: any) {
    console.error("Error fetching stocks from database, using mock data:", error.message);
    res.json(mockStocks);
  }
});

// GET single stock by symbol
router.get("/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    if (isDatabaseConnected()) {
      const stock = await Stock.findOne({ symbol });
      if (!stock) return res.status(404).json({ message: "Stock not found" });
      res.json(stock);
    } else {
      console.log(`📊 Using mock data for ${symbol} (database not connected)`);
      const stock = mockStocks.find(s => s.symbol === symbol);
      if (!stock) return res.status(404).json({ message: "Stock not found" });
      res.json(stock);
    }
  } catch (error: any) {
    console.error("Error fetching stock from database, using mock data:", error.message);
    const symbol = req.params.symbol.toUpperCase();
    const stock = mockStocks.find(s => s.symbol === symbol);
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json(stock);
  }
});

export default router;
