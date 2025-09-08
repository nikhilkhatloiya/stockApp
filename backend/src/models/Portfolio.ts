import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPortfolio extends Document {
  userId: Types.ObjectId;  // not string, it's ObjectId
  stocks: { symbol: string; quantity: number; avgPrice: number }[];
}

const portfolioSchema = new Schema<IPortfolio>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  stocks: [
    {
      symbol: { type: String, required: true },
      quantity: { type: Number, required: true },
      avgPrice: { type: Number, required: true }
    }
  ]
});

export default mongoose.model<IPortfolio>("Portfolio", portfolioSchema);
