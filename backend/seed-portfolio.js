const mongoose = require('mongoose');
require('dotenv').config();

// Portfolio Schema
const portfolioSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  stocks: [
    {
      symbol: { type: String, required: true },
      quantity: { type: Number, required: true },
      avgPrice: { type: Number, required: true }
    }
  ]
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

// Sample portfolio data
const samplePortfolios = [
  {
    userId: "demo-user",
    stocks: [
      { symbol: "AAPL", quantity: 10, avgPrice: 150.00 },
      { symbol: "GOOGL", quantity: 5, avgPrice: 2800.00 },
      { symbol: "MSFT", quantity: 8, avgPrice: 300.00 },
      { symbol: "AMZN", quantity: 3, avgPrice: 3200.00 },
      { symbol: "TSLA", quantity: 2, avgPrice: 800.00 }
    ]
  },
  {
    userId: "user-123",
    stocks: [
      { symbol: "NVDA", quantity: 15, avgPrice: 400.00 },
      { symbol: "META", quantity: 12, avgPrice: 250.00 },
      { symbol: "NFLX", quantity: 6, avgPrice: 450.00 }
    ]
  }
];

async function seedPortfolios() {
  try {
    // Connect to MongoDB Atlas
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing portfolios
    console.log('🧹 Clearing existing portfolios...');
    await Portfolio.deleteMany({});
    console.log('✅ Cleared existing portfolios');

    // Insert sample portfolios
    console.log('📊 Inserting sample portfolios...');
    const portfolios = await Portfolio.insertMany(samplePortfolios);
    console.log(`✅ Inserted ${portfolios.length} portfolios`);

    // Display the inserted data
    console.log('\n📋 Sample Portfolio Data:');
    for (const portfolio of portfolios) {
      console.log(`\n👤 User: ${portfolio.userId}`);
      console.log('📈 Holdings:');
      portfolio.stocks.forEach(stock => {
        console.log(`  • ${stock.symbol}: ${stock.quantity} shares @ $${stock.avgPrice}`);
      });
    }

    console.log('\n🎉 Portfolio seeding completed successfully!');
    console.log('💡 You can now test the portfolio API at: http://localhost:4000/api/portfolio/demo-user');

  } catch (error) {
    console.error('❌ Error seeding portfolios:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedPortfolios();
