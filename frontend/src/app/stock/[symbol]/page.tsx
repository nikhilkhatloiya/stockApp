"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../../config";
import Link from "next/link";

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

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;
  
  const [stock, setStock] = useState<Stock | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    console.log('🔌 Connecting to Socket.IO server for stock:', symbol);
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
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

    // Listen for stock updates
    newSocket.on('priceUpdate', (data: Stock[]) => {
      console.log('💹 Received price update:', data);
      if (Array.isArray(data) && data.length > 0) {
        const updatedStock = data.find(s => s.symbol === symbol);
        if (updatedStock) {
          setStock(updatedStock);
          setLastUpdate(new Date());
        }
      }
    });

    newSocket.on('stockUpdated', (updatedStock: Stock) => {
      console.log('🔄 Stock updated:', updatedStock);
      if (updatedStock.symbol === symbol) {
        setStock(updatedStock);
        setLastUpdate(new Date());
      }
    });

    // Fetch initial stock data
    const fetchStockData = async () => {
      try {
        const response = await fetch(`${SOCKET_URL.replace('ws://', 'http://').replace('wss://', 'https://')}/api/stocks`);
        const stocks = await response.json();
        const foundStock = stocks.find((s: Stock) => s.symbol === symbol);
        if (foundStock) {
          setStock(foundStock);
          setLastUpdate(new Date());
        } else {
          console.error('Stock not found:', symbol);
        }
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up Socket.IO connection');
      newSocket.close();
    };
  }, [mounted, symbol]);

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
    if (change > 0) return 'text-emerald-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getChangeBgColor = (change: number) => {
    if (change > 0) return 'bg-emerald-500/20 border-emerald-500/30';
    if (change < 0) return 'bg-red-500/20 border-red-500/30';
    return 'bg-gray-500/20 border-gray-500/30';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '➖';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">❌</div>
          <h1 className="text-3xl font-bold text-white mb-4">Stock Not Found</h1>
          <p className="text-gray-400 mb-8">The stock symbol "{symbol}" could not be found.</p>
          <Link
            href="/"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 inline-block"
          >
            ← Back to Dashboard
          </Link>
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
              <Link
                href="/"
                className="text-2xl hover:text-purple-400 transition-colors"
              >
                ←
              </Link>
              <div className="text-2xl">📈</div>
              <h1 className="text-2xl font-bold text-white">{stock.symbol}</h1>
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stock Overview Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-4xl font-bold text-white">{stock.symbol}</h1>
                <span className="text-3xl">{getChangeIcon(stock.change)}</span>
              </div>
              <h2 className="text-xl text-gray-300 mb-2">{stock.name}</h2>
              {stock.metadata?.exchange && (
                <span className="inline-block bg-purple-500/20 text-purple-300 text-sm px-3 py-1 rounded-full">
                  {stock.metadata.exchange}
                </span>
              )}
            </div>
            
            <div className="mt-6 lg:mt-0 lg:text-right">
              <div className="text-5xl font-bold text-white mb-2">
                {formatCurrency(stock.price)}
              </div>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-medium ${getChangeBgColor(stock.change)} ${getChangeColor(stock.change)}`}>
                {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{formatCurrency(stock.previousClose)}</div>
              <div className="text-sm text-gray-400">Previous Close</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{formatCurrency(stock.dayHigh)}</div>
              <div className="text-sm text-gray-400">Day High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{formatCurrency(stock.dayLow)}</div>
              <div className="text-sm text-gray-400">Day Low</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{formatVolume(stock.volume)}</div>
              <div className="text-sm text-gray-400">Volume</div>
            </div>
          </div>
        </div>

        {/* Price Chart Placeholder */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Price Chart
          </h3>
          <div className="h-64 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <p className="text-gray-400">Chart component would go here</p>
              <p className="text-sm text-gray-500 mt-2">Integrate with Chart.js, Recharts, or similar</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Company Info */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-3">🏢</span>
              Company Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Symbol</span>
                <span className="text-white font-medium">{stock.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Name</span>
                <span className="text-white font-medium text-right">{stock.name}</span>
              </div>
              {stock.metadata?.sector && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Sector</span>
                  <span className="text-white font-medium">{stock.metadata.sector}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Last Updated</span>
                <span className="text-white font-medium">
                  {new Date(stock.lastUpdated).toISOString().split('T')[1].split('.')[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Trading Info */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-3">💹</span>
              Trading Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Price</span>
                <span className="text-white font-medium text-lg">{formatCurrency(stock.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Change</span>
                <span className={`font-medium ${getChangeColor(stock.change)}`}>
                  {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Change %</span>
                <span className={`font-medium ${getChangeColor(stock.change)}`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Day Range</span>
                <span className="text-white font-medium text-right">
                  {formatCurrency(stock.dayLow)} - {formatCurrency(stock.dayHigh)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 inline-block shadow-lg hover:shadow-purple-500/25"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}