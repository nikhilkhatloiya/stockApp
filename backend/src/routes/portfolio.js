const express = require("express");
const router = express.Router();

// In-memory DB
let portfolios = {};

router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  res.json(portfolios[userId] || { stocks: [] });
});

router.post("/:userId/buy", (req, res) => {
  const { userId } = req.params;
  const { symbol, quantity } = req.body;

  if (!portfolios[userId]) portfolios[userId] = { stocks: [] };

  let stock = portfolios[userId].stocks.find(s => s.symbol === symbol);
  if (stock) {
    stock.quantity += quantity;
  } else {
    portfolios[userId].stocks.push({ symbol, quantity, avgPrice: 100 }); // dummy avg price
  }

  res.json({ message: "Stock bought", portfolio: portfolios[userId] });
});

router.post("/:userId/sell", (req, res) => {
  const { userId } = req.params;
  const { symbol, quantity } = req.body;

  if (!portfolios[userId]) return res.json({ message: "No portfolio" });

  let stock = portfolios[userId].stocks.find(s => s.symbol === symbol);
  if (stock) {
    stock.quantity -= quantity;
    if (stock.quantity <= 0) {
      portfolios[userId].stocks = portfolios[userId].stocks.filter(s => s.symbol !== symbol);
    }
  }

  res.json({ message: "Stock sold", portfolio: portfolios[userId] });
});

module.exports = router;
