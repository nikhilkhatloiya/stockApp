import mongoose, { Schema, Document } from "mongoose";

export interface IPortfolio extends Document {
  userId: string;  // Changed to string for demo purposes
  stocks: { symbol: string; quantity: number; avgPrice: number }[];
}

const portfolioSchema = new Schema<IPortfolio>({
  userId: { type: String, required: true },
  stocks: [
    {
      symbol: { type: String, required: true },
      quantity: { type: Number, required: true },
      avgPrice: { type: Number, required: true }
    }
  ]
});

export default mongoose.model<IPortfolio>("Portfolio", portfolioSchema);
