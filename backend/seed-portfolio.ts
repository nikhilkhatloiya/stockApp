import mongoose from 'mongoose';
import Portfolio from './src/models/Portfolio';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Mock portfolio data
const mockPortfolioData = {
  userId: "demo-user",
  stocks: [
    { symbol: "AAPL", quantity: 10, avgPrice: 150.00 },
    { symbol: "GOOGL", quantity: 5, avgPrice: 2800.00 },
    { symbol: "TSLA", quantity: 8, avgPrice: 200.00 },
    { symbol: "MSFT", quantity: 15, avgPrice: 300.00 },
    { symbol: "AMZN", quantity: 3, avgPrice: 3200.00 },
    { symbol: "META", quantity: 12, avgPrice: 250.00 },
    { symbol: "NVDA", quantity: 6, avgPrice: 400.00 },
    { symbol: "NFLX", quantity: 4, avgPrice: 450.00 }
  ]
};

async function seedPortfolio() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockdb-local');
    console.log('✅ Connected to MongoDB');

    // Clear existing portfolio for demo-user
    await Portfolio.deleteOne({ userId: "demo-user" });
    console.log('🗑️  Cleared existing demo portfolio');

    // Create new portfolio
    const portfolio = new Portfolio(mockPortfolioData);
    await portfolio.save();
    console.log('📊 Created mock portfolio with', portfolio.stocks.length, 'stocks');

    // Display the created portfolio
    console.log('\n📈 Mock Portfolio Data:');
    portfolio.stocks.forEach(stock => {
      console.log(`  ${stock.symbol}: ${stock.quantity} shares @ $${stock.avgPrice.toFixed(2)}`);
    });

    console.log('\n✅ Portfolio seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding portfolio:', error);
    process.exit(1);
  }
}

seedPortfolio();
