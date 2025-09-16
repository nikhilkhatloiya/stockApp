const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

async function createDemoUser() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Check if demo user already exists
    const existingDemo = await User.findOne({ email: "demo@example.com" });
    if (existingDemo) {
      console.log('👤 Demo user already exists:');
      console.log(`   Name: ${existingDemo.name}`);
      console.log(`   Email: ${existingDemo.email}`);
      console.log(`   ID: ${existingDemo._id}`);
      return;
    }

    // Create demo user
    console.log('👤 Creating demo user...');
    const hashedPassword = await bcrypt.hash("demo123", 10);
    const demoUser = new User({
      name: "Demo User",
      email: "demo@example.com",
      password: hashedPassword
    });

    await demoUser.save();
    console.log('✅ Demo user created successfully!');
    console.log(`   Name: ${demoUser.name}`);
    console.log(`   Email: ${demoUser.email}`);
    console.log(`   ID: ${demoUser._id}`);
    console.log('   Password: demo123');

  } catch (error) {
    console.error('❌ Error creating demo user:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

createDemoUser();
