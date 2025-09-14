import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import connectDB from "./config/db";

import stockRoutes from "./routes/stockRoutes";
import userRoutes from "./routes/userRoutes";
import portfolioRoutes from "./routes/portfolioRoutes";
import { startPriceUpdates, shutdownPriceUpdates } from "./utils/priceUpdater";

dotenv.config();

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Graceful shutdown function
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop price updates and close change streams
    await shutdownPriceUpdates();
    
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
    }
    
    // Close HTTP server
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          console.log('✅ HTTP server closed');
          resolve();
        });
      });
    }
    
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Initialize database connection with retry logic
async function initializeDatabase() {
  let isConnected = false;
  
  try {
    await connectDB();
    isConnected = true;
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.log("⚠️  Database connection failed, server will run with limited functionality:", (error as Error).message);
    isConnected = false;
  }
  
  // Monitor database connection
  mongoose.connection.on('connected', () => {
    console.log('📡 MongoDB connected');
    isConnected = true;
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('📡 MongoDB disconnected');
    isConnected = false;
  });
  
  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB error:', error);
    isConnected = false;
  });
  
  return isConnected;
}

// Express app setup
const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'http://localhost:3000']
    : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.status(200).json(health);
});

app.get("/", (req, res) => {
  res.json({
    message: "Stock Dashboard API is running",
    version: "2.0.0",
    features: [
      "Real-time stock data",
      "MongoDB Atlas integration", 
      "WebSocket live updates",
      "Multiple API providers",
      "Change stream monitoring"
    ],
    endpoints: {
      health: "/health",
      stocks: "/api/stocks",
      users: "/api/users",
      portfolio: "/api/portfolio"
    }
  });
});

// Test endpoint to verify Socket.IO data
app.get("/test-socket", (req, res) => {
  if (io) {
    const testData = { message: "Test from server", timestamp: new Date().toISOString() };
    io.emit('test', testData);
    res.json({ message: "Test data sent via Socket.IO", data: testData });
  } else {
    res.json({ error: "Socket.IO not initialized" });
  }
});

// API routes
app.use("/api/stocks", stockRoutes);
app.use("/api/users", userRoutes);
app.use("/api/portfolio", portfolioRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 Express error:', error);
  
  res.status(error.status || 500).json({
    error: {
      message: error.message || 'Internal server error',
      status: error.status || 500,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.originalUrl} not found`,
      status: 404
    }
  });
});

// Create HTTP server (declare globally for graceful shutdown)
let server: any = null;
let io: any = null;

// Socket.IO connection handling is now managed by priceUpdater
// This ensures proper initialization order and error handling

// Start server
async function startServer() {
  try {
    // Initialize database
    const dbConnected = await initializeDatabase();
    
    // Create HTTP server
    server = createServer(app);
    
    // Setup WebSocket with enhanced configuration
    io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.FRONTEND_URL || 'http://localhost:3000']
          : "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });
    
    // Start the server
    const PORT = parseInt(process.env.PORT || '4000');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Start price updates after server is listening
      startPriceUpdates(io).catch(error => {
        console.error('❌ Failed to start price updates:', error);
      });
    });
    
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try killing the process using that port:');
        console.log(`   lsof -ti:${PORT} | xargs kill -9`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        gracefulShutdown('server-error');
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();
