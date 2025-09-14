"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";

interface Stock {
  _id: string;
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  lastUpdated: string;
  formattedChange: string;
  metadata?: {
    exchange?: string;
    sector?: string;
  };
}

export default function HomePage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Temporarily remove mounted check to debug
    // if (!mounted) return;
    
    console.log('🔌 Connecting to Socket.IO server at:', SOCKET_URL);
    
    // Initialize Socket.IO connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      console.log('🔌 Socket ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚨 Connection error:', error);
      console.error('🚨 Error details:', error.message);
      setIsConnected(false);
    });

    // Test listener
    newSocket.on('test', (data) => {
      console.log('🧪 Received test data:', data);
    });

    // Listen for initial stock data
    newSocket.on('initialStockData', (data: Stock[]) => {
      console.log('📊 Received initial stock data:', data);
      console.log('📊 Number of stocks:', data.length);
      setStocks(data);
      setLastUpdate(new Date());
    });

    // Listen for real-time price updates
    newSocket.on('priceUpdate', (data: Stock[]) => {
      console.log('💹 Received price update:', data);
      if (Array.isArray(data) && data.length > 0) {
        if (data.length === 1) {
          // Single stock update
          setStocks(prevStocks => 
            prevStocks.map(stock => 
              stock.symbol === data[0].symbol ? data[0] : stock
            )
          );
        } else {
          // Multiple stocks update (initial data)
          setStocks(data);
        }
        setLastUpdate(new Date());
      }
    });

    // Listen for individual stock updates
    newSocket.on('stockUpdated', (updatedStock: Stock) => {
      console.log('🔄 Stock updated:', updatedStock);
      setStocks(prevStocks => 
        prevStocks.map(stock => 
          stock.symbol === updatedStock.symbol ? updatedStock : stock
        )
      );
      setLastUpdate(new Date());
    });

    // Listen for new stocks added
    newSocket.on('stockAdded', (newStock: Stock) => {
      console.log('➕ New stock added:', newStock);
      setStocks(prevStocks => [...prevStocks, newStock]);
      setLastUpdate(new Date());
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up Socket.IO connection');
      newSocket.close();
    };
  }, []); // Remove mounted dependency for now

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '📈';
    if (change < 0) return '📉';
    return '➖';
  };

  // Temporarily remove mounted check to debug hydration issues
  // if (!mounted) {
  //   return (
  //     <main className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
  //       <div className="max-w-7xl mx-auto">
  //         <div className="text-center py-12">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
  //           <p className="text-gray-600">Loading... (Not mounted yet)</p>
  //           <p className="text-sm text-gray-500 mt-2">Mounted: {mounted ? 'Yes' : 'No'}</p>
  //         </div>
  //       </div>
  //     </main>
  //   );
  // }

  return (
    <main className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📈 Live Stock Dashboard</h1>
            <p className="text-gray-600">Real-time stock prices with MongoDB Atlas integration</p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            
            {lastUpdate && (
              <div className="text-sm text-gray-500">
                Last update: {lastUpdate.toISOString().split('T')[1].split('.')[0]}
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {stocks.length === 0 && isConnected && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading stock data...</p>
            <p className="text-sm text-gray-500 mt-2">Connected: {isConnected ? 'Yes' : 'No'}</p>
            <p className="text-sm text-gray-500">Stocks: {stocks.length}</p>
          </div>
        )}

        {/* Disconnected State */}
        {!isConnected && stocks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Connecting to server...</h3>
            <p className="text-gray-500">Please make sure the backend server is running on port 4000</p>
          </div>
        )}

        {/* Stock Grid */}
        {stocks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {stocks.map((stock) => (
              <div key={stock.symbol} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                {/* Stock Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{stock.symbol}</h2>
                    <p className="text-sm text-gray-500 truncate">{stock.name}</p>
                    {stock.metadata?.exchange && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                        {stock.metadata.exchange}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl">
                    {getChangeIcon(stock.change)}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatCurrency(stock.price)}
                  </div>
                  <div className={`text-sm font-medium ${getChangeColor(stock.change)}`}>
                    {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                  </div>
                </div>

                {/* Stock Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Prev Close:</span>
                    <span className="font-medium">{formatCurrency(stock.previousClose)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Day Range:</span>
                    <span className="font-medium">{formatCurrency(stock.dayLow)} - {formatCurrency(stock.dayHigh)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Volume:</span>
                    <span className="font-medium">{formatVolume(stock.volume)}</span>
                  </div>
                </div>

                {/* View Details Button */}
                <Link
                  href={`/stocks/${stock.symbol}`}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-block text-center"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex space-x-4">
          <Link
            href="/portfolio"
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <span>💼</span>
            <span>My Portfolio</span>
          </Link>
          
          <Link
            href="/api-docs"
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <span>📋</span>
            <span>API Documentation</span>
          </Link>
        </div>

        {/* Stats Footer */}
        {stocks.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Market Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stocks.length}</div>
                <div className="text-sm text-gray-500">Total Stocks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stocks.filter(s => s.change > 0).length}
                </div>
                <div className="text-sm text-gray-500">Gainers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {stocks.filter(s => s.change < 0).length}
                </div>
                <div className="text-sm text-gray-500">Losers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {stocks.filter(s => s.change === 0).length}
                </div>
                <div className="text-sm text-gray-500">Unchanged</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
