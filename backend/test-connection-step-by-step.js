const mongoose = require('mongoose');
require('dotenv').config();

async function testConnectionStepByStep() {
  console.log('🔍 Step-by-step MongoDB Atlas connection test\n');
  
  // Step 1: Check if .env file is loaded
  console.log('Step 1: Checking environment variables...');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('ALPHA_VANTAGE_API_KEY exists:', !!process.env.ALPHA_VANTAGE_API_KEY);
  console.log('FINHUB_API_KEY exists:', !!process.env.FINHUB_API_KEY);
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file');
    return;
  }
  
  // Step 2: Check if password is still placeholder
  console.log('\nStep 2: Checking connection string...');
  if (process.env.MONGODB_URI.includes('<db_password>')) {
    console.error('❌ Password placeholder detected in connection string');
    console.log('💡 Please replace <db_password> with your actual database password');
    console.log('💡 Or get the complete connection string from MongoDB Atlas dashboard');
    return;
  }
  
  // Step 3: Test connection
  console.log('\nStep 3: Testing connection...');
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📍 Database: ${conn.connection.name}`);
    
    // Step 4: Test database operations
    console.log('\nStep 4: Testing database operations...');
    
    // Create a test collection
    const testCollection = conn.connection.db.collection('test');
    await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
    console.log('✅ Test document inserted successfully');
    
    // Clean up test document
    await testCollection.deleteOne({ test: 'connection' });
    console.log('✅ Test document cleaned up');
    
    console.log('\n🎉 All tests passed! Your MongoDB Atlas connection is working perfectly.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('1. Your database username and password');
      console.log('2. Make sure the user has read/write permissions');
      console.log('3. Verify the connection string is correct');
    } else if (error.message.includes('IP whitelist')) {
      console.log('\n💡 IP whitelist issue. Please check:');
      console.log('1. Add your current IP to MongoDB Atlas IP whitelist');
      console.log('2. Or add 0.0.0.0/0 to allow all IPs (for testing only)');
    } else {
      console.log('\n💡 Other connection issue. Please check:');
      console.log('1. Your internet connection');
      console.log('2. MongoDB Atlas cluster status');
      console.log('3. Connection string format');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testConnectionStepByStep();
