"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  const symbol = params.symbol as string;
  
  const [stock, setStock] = useState<Stock | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [, setSocket] = useState<Socket | null>(null);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">❌</div>
          <h1 className="text-3xl font-bold text-white mb-4">Stock Not Found</h1>
          <p className="text-gray-400 mb-8">The stock symbol &quot;{symbol}&quot; could not be found.</p>
          <Link
            href="/"
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 inline-block"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl hover:text-orange-500 transition-colors">←</Link>
              <div className="text-2xl">📈</div>
              <h1 className="text-2xl font-bold text-gray-900">{stock.symbol}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${isConnected
                  ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                  : 'bg-red-100 text-red-600 border border-red-200'
                }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
                  }`}></div>
                {isConnected ? 'Live' : 'Offline'}
              </div>
              {lastUpdate && (
                <div className="text-sm text-gray-500 hidden sm:block">
                  Last update: {lastUpdate.toISOString().split('T')[1].split('.')[0]}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stock Overview Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{stock.symbol}</h1>
                <span className="text-2xl">{getChangeIcon(stock.change)}</span>
              </div>
              <h2 className="text-lg text-gray-600 mb-1">{stock.name}</h2>
              {stock.metadata?.exchange && (
                <span className="inline-block bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full">
                  {stock.metadata.exchange}
                </span>
              )}
            </div>

            <div className="mt-4 lg:mt-0 lg:text-right">
              <div className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(stock.price)}</div>
              <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${getChangeBgColor(stock.change)} ${getChangeColor(stock.change)}`}>
                {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-700">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-1">{formatCurrency(stock.previousClose)}</div>
              <div className="text-sm text-gray-500">Previous Close</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-1">{formatCurrency(stock.dayHigh)}</div>
              <div className="text-sm text-gray-500">Day High</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-1">{formatCurrency(stock.dayLow)}</div>
              <div className="text-sm text-gray-500">Day Low</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-1">{formatVolume(stock.volume)}</div>
              <div className="text-sm text-gray-500">Volume</div>
            </div>
          </div>
        </div>

        {/* Price Chart Placeholder */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Price Chart
          </h3>
          <div className="h-64 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📈</div>
              Chart component would go here
            </div>
          </div>
        </div>

        {/* Company & Trading Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🏢</span>
              Company Information
            </h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between"><span>Symbol</span><span className="font-medium">{stock.symbol}</span></div>
              <div className="flex justify-between"><span>Name</span><span className="font-medium text-right">{stock.name}</span></div>
              {stock.metadata?.sector && <div className="flex justify-between"><span>Sector</span><span className="font-medium">{stock.metadata.sector}</span></div>}
              <div className="flex justify-between"><span>Last Updated</span><span className="font-medium">{stock.lastUpdated
                ? new Date(stock.lastUpdated).toLocaleTimeString()
                : "N/A"}</span></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">💹</span>
              Trading Information
            </h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between"><span>Current Price</span><span className="font-medium">{formatCurrency(stock.price)}</span></div>
              <div className="flex justify-between"><span>Change</span><span className={`font-medium ${getChangeColor(stock.change)}`}>{stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}</span></div>
              <div className="flex justify-between"><span>Change %</span><span className={`font-medium ${getChangeColor(stock.change)}`}>{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span></div>
              <div className="flex justify-between"><span>Day Range</span><span className="font-medium text-right">{formatCurrency(stock.dayLow)} - {formatCurrency(stock.dayHigh)}</span></div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white font-medium px-6 py-3 rounded-lg inline-block shadow-md transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>

  );
}