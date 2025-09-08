import { Router } from "express";
import Portfolio from "../models/Portfolio";
import Stock from "../models/Stock";

const router = Router();

// GET portfolio by userId
router.get("/:userId", async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.params.userId });
    if (!portfolio) return res.json({ stocks: [] });
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: "Error fetching portfolio" });
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
