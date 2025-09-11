import mongoose, { Schema, Document } from "mongoose";

export interface IStock extends Document {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  lastUpdated: Date;
  isActive: boolean;
  history: {
    price: number;
    timestamp: Date;
  }[];
  metadata: {
    exchange?: string;
    sector?: string;
    industry?: string;
  };
}

const stockSchema = new Schema<IStock>({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  previousClose: { type: Number, required: true, min: 0 },
  change: { type: Number, required: true },
  changePercent: { type: Number, required: true },
  volume: { type: Number, required: true, min: 0 },
  marketCap: { type: Number, min: 0 },
  dayHigh: { type: Number, required: true, min: 0 },
  dayLow: { type: Number, required: true, min: 0 },
  fiftyTwoWeekHigh: { type: Number, min: 0 },
  fiftyTwoWeekLow: { type: Number, min: 0 },
  lastUpdated: { type: Date, required: true, default: Date.now },
  isActive: { type: Boolean, required: true, default: true },
  history: [{
    price: { type: Number, required: true, min: 0 },
    timestamp: { type: Date, required: true, default: Date.now }
  }],
  metadata: {
    exchange: { type: String },
    sector: { type: String },
    industry: { type: String }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
stockSchema.index({ symbol: 1 });
stockSchema.index({ lastUpdated: -1 });
stockSchema.index({ isActive: 1 });

// Virtual for formatted change display
stockSchema.virtual('formattedChange').get(function() {
  const sign = this.change >= 0 ? '+' : '';
  return `${sign}${this.change.toFixed(2)} (${sign}${this.changePercent.toFixed(2)}%)`;
});

// Method to add price to history with automatic cleanup (keep last 100 entries)
stockSchema.methods.addPriceToHistory = function(price: number) {
  this.history.push({ price, timestamp: new Date() });
  
  // Keep only last 100 entries to prevent unlimited growth
  if (this.history.length > 100) {
    this.history = this.history.slice(-100);
  }
  
  return this;
};

// Static method to find active stocks
stockSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ symbol: 1 });
};

export default mongoose.model<IStock>("Stock", stockSchema);


