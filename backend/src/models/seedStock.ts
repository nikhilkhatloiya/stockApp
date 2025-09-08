import mongoose from "mongoose";
import dotenv from "dotenv";
import Stock from "../models/Stock";

dotenv.config();

const seedStocks = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const mockStocks = [
    { symbol: "AAPL", name: "Apple Inc.", price: 180, history: [175, 176, 178, 180] },
    { symbol: "GOOG", name: "Alphabet Inc.", price: 2800, history: [2750, 2775, 2790, 2800] },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 320, history: [310, 312, 315, 320] },
    { symbol: "TSLA", name: "Tesla Inc.", price: 700, history: [680, 690, 695, 700] }
  ];

  await Stock.deleteMany({});
  await Stock.insertMany(mockStocks);

  console.log("Mock stock data seeded!");
  process.exit();
};

seedStocks();
