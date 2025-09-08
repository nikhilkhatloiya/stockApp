import mongoose, { Schema, Document } from "mongoose";

export interface IStock extends Document {
  symbol: string;
  name: string;
  price: number;
  history: number[];
}

const stockSchema = new Schema<IStock>({
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  history: { type: [Number], default: [] }
});

export default mongoose.model<IStock>("Stock", stockSchema);


