import mongoose from "mongoose";

const connectDB = async () => {
  const maxRetries = 3;
  let retryCount = 0;

  const connectionOptions = {
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000, // 45 seconds
    maxPoolSize: 10,
    retryWrites: true,
  };

  while (retryCount < maxRetries) {
    try {
      // Try Atlas connection first
      const atlasURI = process.env.MONGODB_URI;
      
      if (atlasURI) {
        console.log(`Attempting MongoDB Atlas connection (attempt ${retryCount + 1}/${maxRetries})...`);
        const conn = await mongoose.connect(atlasURI, connectionOptions);
        console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
        return;
      } else {
        throw new Error("MONGODB_URI not found in environment variables");
      }
    } catch (error: any) {
      console.error(`❌ MongoDB Atlas connection failed (attempt ${retryCount + 1}/${maxRetries}):`, error.message);
      retryCount++;

      if (retryCount >= maxRetries) {
        console.log("🔄 Falling back to local MongoDB...");
        
        try {
          // Fallback to local MongoDB
          const localURI = "mongodb://127.0.0.1:27017/stockdb-local";
          const conn = await mongoose.connect(localURI, {
            ...connectionOptions,
            serverSelectionTimeoutMS: 5000, // Shorter timeout for local
          });
          console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);
          return;
        } catch (localError: any) {
          console.error("❌ Local MongoDB connection also failed:", localError.message);
          console.log("\n💡 Solutions:");
          console.log("1. Check your internet connection for MongoDB Atlas");
          console.log("2. Verify MongoDB Atlas IP whitelist includes your current IP");
          console.log("3. Install and start local MongoDB: brew install mongodb-community");
          console.log("4. Check if your MongoDB Atlas credentials are correct\n");
          
          // Don't exit process, let app continue without database
          console.log("⚠️  Starting server without database connection...");
          return;
        }
      } else {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
};

export default connectDB;
