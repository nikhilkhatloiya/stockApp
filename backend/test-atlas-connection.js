const mongoose = require('mongoose');
require('dotenv').config();

async function testAtlasConnection() {
  try {
    console.log('🔌 Testing MongoDB Atlas connection...');
    console.log('📍 Connection string:', process.env.MONGODB_URI ? 'Found' : 'Not found');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env file');
      console.log('💡 Please create a .env file with your MongoDB Atlas connection string');
      return;
    }

    // Connect to MongoDB Atlas
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📍 Database: ${conn.connection.name}`);
    console.log(`📍 Ready State: ${conn.connection.readyState}`);

    // Test database operations
    console.log('\n🧪 Testing database operations...');
    
    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📋 Collections:', collections.map(c => c.name));

    // Test Portfolio model
    const Portfolio = mongoose.model('Portfolio', new mongoose.Schema({
      userId: String,
      stocks: [{ symbol: String, quantity: Number, avgPrice: Number }]
    }));

    // Count portfolios
    const portfolioCount = await Portfolio.countDocuments();
    console.log(`📊 Portfolio count: ${portfolioCount}`);

    // Get sample portfolio
    const samplePortfolio = await Portfolio.findOne();
    if (samplePortfolio) {
      console.log('📋 Sample portfolio:', {
        userId: samplePortfolio.userId,
        stocksCount: samplePortfolio.stocks.length
      });
    } else {
      console.log('📋 No portfolios found');
    }

    console.log('\n🎉 MongoDB Atlas connection test successful!');

  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify your MongoDB Atlas IP whitelist includes your current IP');
    console.log('3. Check your username and password in the connection string');
    console.log('4. Make sure your cluster is running');
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testAtlasConnection();
