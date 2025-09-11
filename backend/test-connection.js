const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://nikhilkhatloiya_db_user:ZCgisVBmWjnh7iLV@stockapp.03dpya9.mongodb.net/stockdb?retryWrites=true&w=majority&appName=stockApp';

async function testConnection() {
    try {
        await mongoose.connect(connectionString);
        console.log('✅ Successfully connected to MongoDB!');
        
        // Test the connection
        const db = mongoose.connection.db;
        const admin = db.admin();
        const status = await admin.ping();
        console.log('📡 Database ping successful:', status);
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connection closed');
        process.exit(0);
    }
}

testConnection();
