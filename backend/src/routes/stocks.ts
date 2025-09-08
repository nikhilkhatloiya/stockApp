import express from 'express';

const router = express.Router();

// GET /api/stocks - Get all stocks
router.get('/', (req, res) => {
  res.json({
    message: 'Stocks endpoint',
    data: []
  });
});

// GET /api/stocks/:symbol - Get specific stock
router.get('/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.json({
    message: `Stock data for ${symbol}`,
    symbol: symbol.toUpperCase(),
    data: {}
  });
});

export default router;
