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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"symbol" | "price" | "change" | "volume">("symbol");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    console.log('🔌 Connecting to Socket.IO server at:', SOCKET_URL);
    
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
      setIsConnected(false);
    });

    newSocket.on('test', (data) => {
      console.log('🧪 Received test data:', data);
    });

    newSocket.on('initialStockData', (data: Stock[]) => {
      console.log('📊 Received initial stock data:', data);
      setStocks(data);
      setLastUpdate(new Date());
    });

    newSocket.on('priceUpdate', (data: Stock[]) => {
      console.log('💹 Received price update:', data);
      if (Array.isArray(data) && data.length > 0) {
        if (data.length === 1) {
          setStocks(prevStocks => 
            prevStocks.map(stock => 
              stock.symbol === data[0].symbol ? data[0] : stock
            )
          );
        } else {
          setStocks(data);
        }
        setLastUpdate(new Date());
      }
    });

    newSocket.on('stockUpdated', (updatedStock: Stock) => {
      console.log('🔄 Stock updated:', updatedStock);
      setStocks(prevStocks => 
        prevStocks.map(stock => 
          stock.symbol === updatedStock.symbol ? updatedStock : stock
        )
      );
      setLastUpdate(new Date());
    });

    newSocket.on('stockAdded', (newStock: Stock) => {
      console.log('➕ New stock added:', newStock);
      setStocks(prevStocks => [...prevStocks, newStock]);
      setLastUpdate(new Date());
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up Socket.IO connection');
      newSocket.close();
    };
  }, [mounted]);

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
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getChangeBgColor = (change: number) => {
    if (change > 0) return 'bg-emerald-50 border-emerald-200';
    if (change < 0) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '➖';
  };

  // Filter and sort stocks
  const filteredStocks = stocks
    .filter(stock => 
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "change":
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case "volume":
          aValue = a.volume;
          bValue = b.volume;
          break;
        default:
          aValue = a.symbol;
          bValue = b.symbol;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">📈</div>
              <h1 className="text-2xl font-bold text-white">Live Stock Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                {isConnected ? 'Live' : 'Offline'}
              </div>
              
              {lastUpdate && (
                <div className="text-sm text-gray-300 hidden sm:block">
                  Last update: {lastUpdate.toISOString().split('T')[1].split('.')[0]}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Controls */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="symbol">Symbol</option>
                <option value="price">Price</option>
                <option value="change">Change %</option>
                <option value="volume">Volume</option>
              </select>
            </div>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm transition-colors"
            >
              <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {stocks.length === 0 && isConnected && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading stock data...</p>
            <p className="text-gray-400 text-sm mt-2">Connected: {isConnected ? 'Yes' : 'No'}</p>
          </div>
        )}

        {/* Disconnected State */}
        {!isConnected && stocks.length === 0 && (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🔌</div>
            <h3 className="text-2xl font-semibold text-white mb-4">Connecting to server...</h3>
            <p className="text-gray-400">Please make sure the backend server is running on port 4000</p>
          </div>
        )}

        {/* Stock Grid */}
        {filteredStocks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredStocks.map((stock, index) => (
              <div 
                key={stock.symbol} 
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Stock Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h2 className="text-xl font-bold text-white">{stock.symbol}</h2>
                      <span className="text-lg">{getChangeIcon(stock.change)}</span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{stock.name}</p>
                    {stock.metadata?.exchange && (
                      <span className="inline-block bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full mt-2">
                        {stock.metadata.exchange}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price Section */}
                <div className="mb-6">
                  <div className="text-3xl font-bold text-white mb-2">
                    {formatCurrency(stock.price)}
                  </div>
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getChangeBgColor(stock.change)} ${getChangeColor(stock.change)}`}>
                    {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                  </div>
                </div>

                {/* Stock Details */}
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Previous Close</span>
                    <span className="text-white font-medium">{formatCurrency(stock.previousClose)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Day Range</span>
                    <span className="text-white font-medium text-right">
                      {formatCurrency(stock.dayLow)} - {formatCurrency(stock.dayHigh)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Volume</span>
                    <span className="text-white font-medium">{formatVolume(stock.volume)}</span>
                  </div>
                </div>

                {/* View Details Button */}
                <Link
                  href={`/stock/${stock.symbol}`}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 inline-block text-center group-hover:shadow-lg group-hover:shadow-purple-500/25"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {stocks.length > 0 && filteredStocks.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No stocks found</h3>
            <p className="text-gray-400">Try adjusting your search terms</p>
          </div>
        )}

        {/* Market Overview */}
        {stocks.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">📊</span>
              Market Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">{stocks.length}</div>
                <div className="text-sm text-gray-400">Total Stocks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-2">
                  {stocks.filter(s => s.change > 0).length}
                </div>
                <div className="text-sm text-gray-400">Gainers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400 mb-2">
                  {stocks.filter(s => s.change < 0).length}
                </div>
                <div className="text-sm text-gray-400">Losers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400 mb-2">
                  {stocks.filter(s => s.change === 0).length}
                </div>
                <div className="text-sm text-gray-400">Unchanged</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/portfolio"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-emerald-500/25"
          >
            <span className="text-xl">💼</span>
            <span>My Portfolio</span>
          </Link>
          
          <Link
            href="/api-docs"
            className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-gray-500/25"
          >
            <span className="text-xl">📋</span>
            <span>API Documentation</span>
          </Link>
        </div>
      </main>
    </div>
  );
}