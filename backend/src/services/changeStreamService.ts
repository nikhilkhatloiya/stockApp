import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Stock, { IStock } from '../models/Stock';

class ChangeStreamService {
  private io: Server | null = null;
  private changeStreams: mongoose.mongo.ChangeStream[] = [];
  private isWatching = false;

  setSocketServer(io: Server) {
    this.io = io;
  }

  async startWatching() {
    if (this.isWatching || !this.io) {
      return;
    }

    try {
      // Ensure we're connected to MongoDB
      if (mongoose.connection.readyState !== 1) {
        console.log('⏳ Waiting for MongoDB connection before starting change streams...');
        await new Promise((resolve) => {
          const checkConnection = () => {
            if (mongoose.connection.readyState === 1) {
              resolve(true);
            } else {
              setTimeout(checkConnection, 1000);
            }
          };
          checkConnection();
        });
      }

      // Check if we're using local MongoDB (change streams not supported)
      const isLocalMongoDB = mongoose.connection.host === '127.0.0.1' || mongoose.connection.host === 'localhost';
      if (isLocalMongoDB) {
        console.log('⚠️  Local MongoDB detected - change streams not supported, using polling instead');
        this.startPollingMode();
        this.isWatching = true;
        return;
      }

      console.log('📡 Starting MongoDB change streams...');
      
      // Watch for stock collection changes
      this.watchStockChanges();
      
      this.isWatching = true;
      console.log('✅ Change streams initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to start change streams:', error);
      // Fallback to polling mode
      console.log('🔄 Falling back to polling mode...');
      this.startPollingMode();
      this.isWatching = true;
    }
  }

  private watchStockChanges() {
    try {
      const stockChangeStream = Stock.watch(
        [
          {
            $match: {
              $or: [
                { operationType: 'insert' },
                { operationType: 'update' },
                { operationType: 'replace' }
              ]
            }
          }
        ],
        {
          fullDocument: 'updateLookup', // Get the full document after update
          fullDocumentBeforeChange: 'whenAvailable' // Get document before change if available
        }
      );

      stockChangeStream.on('change', (change) => {
        this.handleStockChange(change);
      });

      stockChangeStream.on('error', (error: any) => {
        console.error('❌ Stock change stream error:', error);
        // Don't restart if it's a local MongoDB error
        if (error.code === 40573) {
          console.log('🔄 Change streams not supported, switching to polling mode...');
          this.startPollingMode();
        } else {
          // Attempt to restart the change stream for other errors
          setTimeout(() => this.restartWatching(), 5000);
        }
      });

      stockChangeStream.on('close', () => {
        console.log('📡 Stock change stream closed');
        this.isWatching = false;
      });

      this.changeStreams.push(stockChangeStream);
      console.log('👀 Watching for stock collection changes...');
      
    } catch (error) {
      console.error('❌ Error setting up stock change stream:', error);
    }
  }

  private handleStockChange(change: any) {
    try {
      const { operationType, fullDocument, documentKey } = change;
      
      if (!fullDocument) {
        console.log('⚠️  No full document in change event');
        return;
      }

      const stockData = this.formatStockForClient(fullDocument);
      
      switch (operationType) {
        case 'insert':
          console.log(`📈 New stock added: ${stockData.symbol} - $${stockData.price}`);
          this.io?.emit('stockAdded', stockData);
          this.io?.emit('priceUpdate', [stockData]); // Also emit as price update
          break;
          
        case 'update':
        case 'replace':
          console.log(`💹 Stock updated: ${stockData.symbol} - $${stockData.price} (${stockData.formattedChange})`);
          this.io?.emit('stockUpdated', stockData);
          this.io?.emit('priceUpdate', [stockData]); // Maintain compatibility
          break;
          
        default:
          console.log(`🔄 Stock operation ${operationType}:`, documentKey);
      }

      // Emit real-time price data for charts/graphs
      if (stockData.history && stockData.history.length > 0) {
        const latestPrice = stockData.history[stockData.history.length - 1];
        this.io?.emit('realTimePrice', {
          symbol: stockData.symbol,
          price: latestPrice.price,
          timestamp: latestPrice.timestamp,
          change: stockData.change,
          changePercent: stockData.changePercent
        });
      }

    } catch (error) {
      console.error('❌ Error handling stock change:', error);
    }
  }

  private formatStockForClient(stock: IStock): any {
    return {
      _id: stock._id,
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      previousClose: stock.previousClose,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      marketCap: stock.marketCap,
      dayHigh: stock.dayHigh,
      dayLow: stock.dayLow,
      fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: stock.fiftyTwoWeekLow,
      lastUpdated: stock.lastUpdated ? stock.lastUpdated.toISOString() : null, // ✅ always ISO string
      isActive: stock.isActive,
      history: stock.history?.slice(-10).map(h => ({
        price: h.price,
        timestamp: h.timestamp.toISOString(), // ✅ also normalize history timestamps
      })),
      metadata: stock.metadata,
      formattedChange: `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)`
    };
  }  

  // Method to broadcast current stock prices to all connected clients
  async broadcastCurrentPrices() {
    if (!this.io) {
      return;
    }

    try {
      const activeStocks = await Stock.find({ isActive: true }).sort({ symbol: 1 });
      const formattedStocks = activeStocks.map(stock => this.formatStockForClient(stock));
      
      this.io.emit('priceUpdate', formattedStocks);
      console.log(`📊 Broadcasted prices for ${formattedStocks.length} stocks`);
      
    } catch (error) {
      console.error('❌ Error broadcasting current prices:', error);
    }
  }

  // Method to broadcast stock data for a specific symbol
  async broadcastStockUpdate(symbol: string) {
    if (!this.io) {
      return;
    }

    try {
      const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      if (stock) {
        const formattedStock = this.formatStockForClient(stock);
        this.io.emit('stockUpdated', formattedStock);
        this.io.emit('priceUpdate', [formattedStock]);
        console.log(`📈 Broadcasted update for ${symbol}`);
      }
    } catch (error) {
      console.error(`❌ Error broadcasting update for ${symbol}:`, error);
    }
  }

  // Method to handle client connections and send initial data
  async handleClientConnection(socket: any) {
    try {
      console.log(`🔌 Client connected: ${socket.id}`);
      
      // Send initial stock data to the newly connected client
      const activeStocks = await Stock.find({ isActive: true }).sort({ symbol: 1 });
      const formattedStocks = activeStocks.map(stock => this.formatStockForClient(stock));
      
      socket.emit('initialStockData', formattedStocks);
      socket.emit('priceUpdate', formattedStocks); // Also send as price update for compatibility
      
      console.log(`📤 Sent initial data for ${formattedStocks.length} stocks to client ${socket.id}`);
      
      // Handle client-specific events
      socket.on('subscribe', (symbols: string[]) => {
        if (Array.isArray(symbols)) {
          socket.join(symbols.map(s => `stock:${s.toUpperCase()}`));
          console.log(`📬 Client ${socket.id} subscribed to: ${symbols.join(', ')}`);
        }
      });

      socket.on('unsubscribe', (symbols: string[]) => {
        if (Array.isArray(symbols)) {
          symbols.forEach(symbol => {
            socket.leave(`stock:${symbol.toUpperCase()}`);
          });
          console.log(`📭 Client ${socket.id} unsubscribed from: ${symbols.join(', ')}`);
        }
      });

      socket.on('requestStockData', async (symbol: string) => {
        try {
          const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
          if (stock) {
            socket.emit('stockData', this.formatStockForClient(stock));
          } else {
            socket.emit('stockError', { symbol, message: 'Stock not found' });
          }
        } catch (error) {
          socket.emit('stockError', { symbol, message: 'Error fetching stock data' });
        }
      });
      
    } catch (error) {
      console.error('❌ Error handling client connection:', error);
    }
  }

  private async restartWatching() {
    console.log('🔄 Restarting change streams...');
    await this.stopWatching();
    setTimeout(() => this.startWatching(), 2000);
  }

  async stopWatching() {
    if (!this.isWatching) {
      return;
    }

    try {
      console.log('⏹️  Stopping change streams...');
      
      // Close all change streams
      await Promise.all(
        this.changeStreams.map(stream => 
          stream.close().catch(err => console.error('Error closing stream:', err))
        )
      );
      
      this.changeStreams = [];
      this.isWatching = false;
      
      console.log('✅ Change streams stopped');
      
    } catch (error) {
      console.error('❌ Error stopping change streams:', error);
    }
  }

  // Polling mode for local MongoDB
  private startPollingMode() {
    console.log('🔄 Starting polling mode for real-time updates...');
    // Poll every 30 seconds to check for stock updates
    setInterval(async () => {
      try {
        await this.broadcastCurrentPrices();
      } catch (error) {
        console.error('❌ Error in polling mode:', error);
      }
    }, 30000);
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down ChangeStreamService...');
    await this.stopWatching();
    this.io = null;
  }
}

export default new ChangeStreamService();
