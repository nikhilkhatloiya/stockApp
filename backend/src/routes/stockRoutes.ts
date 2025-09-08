import { Router } from "express";
import Stock from "../models/Stock";

const router = Router();

// GET all stocks
router.get("/", async (req, res) => {
  try {
    const stocks = await Stock.find({});
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stocks" });
  }
});

// GET single stock by symbol
router.get("/:symbol", async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stock" });
  }
});

export default router;
