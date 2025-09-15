import { Router } from "express";
import Portfolio from "../models/Portfolio";
import Stock from "../models/Stock";

const router = Router();

// GET portfolio by userId
router.get("/:userId", async (req, res) => {
  try {
    console.log(`📊 Fetching portfolio for userId: ${req.params.userId}`);
    const portfolio = await Portfolio.findOne({ userId: req.params.userId });
    if (!portfolio) {
      console.log(`📊 No portfolio found for userId: ${req.params.userId}, returning empty portfolio`);
      return res.json({ stocks: [] });
    }
    console.log(`📊 Found portfolio with ${portfolio.stocks.length} stocks`);
    res.json(portfolio);
  } catch (error) {
    console.error("❌ Error fetching portfolio:", error);
    res.status(500).json({ message: "Error fetching portfolio", error: (error as Error).message });
  }
});

// GET all portfolios (for admin/debugging)
router.get("/", async (req, res) => {
  try {
    console.log("📊 Fetching all portfolios");
    const portfolios = await Portfolio.find({});
    console.log(`📊 Found ${portfolios.length} portfolios`);
    res.json(portfolios);
  } catch (error) {
    console.error("❌ Error fetching all portfolios:", error);
    res.status(500).json({ message: "Error fetching portfolios", error: (error as Error).message });
  }
});

// POST create/update portfolio (for seeding data)
router.post("/", async (req, res) => {
  try {
    const { userId, stocks } = req.body;
    console.log(`📊 Creating/updating portfolio for userId: ${userId}`);
    
    const portfolio = await Portfolio.findOneAndUpdate(
      { userId },
      { userId, stocks },
      { upsert: true, new: true }
    );
    
    console.log(`📊 Portfolio ${portfolio ? 'created/updated' : 'failed'} with ${stocks?.length || 0} stocks`);
    res.json(portfolio);
  } catch (error) {
    console.error("❌ Error creating/updating portfolio:", error);
    res.status(500).json({ message: "Error creating/updating portfolio", error: (error as Error).message });
  }
});

// BUY stock
router.post("/:userId/buy", async (req, res) => {
  const { symbol, quantity } = req.body;
  try {
    const stock = await Stock.findOne({ symbol });
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    let portfolio = await Portfolio.findOne({ userId: req.params.userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.params.userId, stocks: [] });
    }

    const existing = portfolio.stocks.find((s) => s.symbol === symbol);
    if (existing) {
      existing.avgPrice = (existing.avgPrice * existing.quantity + stock.price * quantity) /
                          (existing.quantity + quantity);
      existing.quantity += quantity;
    } else {
      portfolio.stocks.push({ symbol, quantity, avgPrice: stock.price });
    }

    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: "Error buying stock" });
  }
});

// SELL stock
router.post("/:userId/sell", async (req, res) => {
  const { symbol, quantity } = req.body;
  try {
    const portfolio = await Portfolio.findOne({ userId: req.params.userId });
    if (!portfolio) return res.status(404).json({ message: "Portfolio not found" });

    const stockIndex = portfolio.stocks.findIndex((s) => s.symbol === symbol);
    if (stockIndex === -1) return res.status(404).json({ message: "Stock not in portfolio" });

    if (portfolio.stocks[stockIndex].quantity < quantity) {
      return res.status(400).json({ message: "Not enough quantity to sell" });
    }

    portfolio.stocks[stockIndex].quantity -= quantity;
    if (portfolio.stocks[stockIndex].quantity === 0) {
      portfolio.stocks.splice(stockIndex, 1);
    }

    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: "Error selling stock" });
  }
});

export default router;
