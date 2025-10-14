"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

interface Stock {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  totalValue?: number;
  totalGain?: number;
  totalGainPercent?: number;
  price?: number; // Add price property for real-time updates
}

interface PortfolioData {
  stocks: Stock[];
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
}

function PortfolioContent() {
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    stocks: [],
    totalValue: 0,
    totalGain: 0,
    totalGainPercent: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [, setSocket] = useState<Socket | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userId = user?._id || "demo-user";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    console.log('🔌 Connecting to Socket.IO server for portfolio');
    
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

    // Listen for price updates to recalculate portfolio values
    newSocket.on('priceUpdate', (data: Stock[]) => {
      console.log('💹 Received price update for portfolio:', data);
      if (Array.isArray(data) && data.length > 0) {
        updatePortfolioWithPrices(data);
        setLastUpdate(new Date());
      }
    });

    // Fetch initial portfolio data
    const fetchPortfolioData = async () => {
      try {
        console.log('📊 Fetching portfolio for userId:', userId);
        const response = await fetch(`NEXT_LOCAL/api/portfolio/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Portfolio data received:', data);
          setPortfolio(data);
        } else {
          console.error('Failed to fetch portfolio, status:', response.status);
          // Set empty portfolio if no data found
          setPortfolio({ stocks: [], totalValue: 0, totalGain: 0, totalGainPercent: 0 });
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        // Set empty portfolio on error
        setPortfolio({ stocks: [], totalValue: 0, totalGain: 0, totalGainPercent: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up Socket.IO connection');
      newSocket.close();
    };
  }, [mounted, userId]);

  const updatePortfolioWithPrices = (priceData: Stock[]) => {
    setPortfolio(prevPortfolio => {
      const updatedStocks = prevPortfolio.stocks.map(stock => {
        const currentPriceData = priceData.find(p => p.symbol === stock.symbol);
        if (currentPriceData && currentPriceData.price) {
          const currentPrice = currentPriceData.price;
          const totalValue = currentPrice * stock.quantity;
          const totalCost = stock.avgPrice * stock.quantity;
          const totalGain = totalValue - totalCost;
          const totalGainPercent = (totalGain / totalCost) * 100;
          
          return {
            ...stock,
            currentPrice,
            change: currentPrice - stock.avgPrice,
            changePercent: ((currentPrice - stock.avgPrice) / stock.avgPrice) * 100,
            totalValue,
            totalGain,
            totalGainPercent
          };
        }
        return stock;
      });

      const totalValue = updatedStocks.reduce((sum, stock) => sum + (stock.totalValue || 0), 0);
      const totalCost = updatedStocks.reduce((sum, stock) => sum + (stock.avgPrice * stock.quantity), 0);
      const totalGain = totalValue - totalCost;
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

      return {
        stocks: updatedStocks,
        totalValue,
        totalGain,
        totalGainPercent
      };
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
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
          <p className="text-white text-lg">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Connection Status */}
      <div className="mb-6 flex justify-center">
        <div className={`flex items-center px-4 py-2 rounded-full text-sm font-medium ${
          isConnected 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
          }`}></div>
          {isConnected ? 'Live' : 'Offline'}
          {lastUpdate && (
            <span className="ml-2 text-xs">
              Last update: {lastUpdate.toISOString().split('T')[1].split('.')[0]}
            </span>
          )}
        </div>
      </div>
        {/* Portfolio Summary */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Portfolio Summary
          </h2>
          
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {formatCurrency(portfolio.totalValue)}
              </div>
              <div className="text-sm text-gray-400">Total Value</div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getChangeColor(portfolio.totalGain)}`}>
                {portfolio.totalGain >= 0 ? '+' : ''}{formatCurrency(portfolio.totalGain)}
              </div>
              <div className="text-sm text-gray-400">Total Gain/Loss</div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getChangeColor(portfolio.totalGainPercent)}`}>
                {portfolio.totalGainPercent >= 0 ? '+' : ''}{(portfolio?.totalGainPercent ?? 0).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-400">Total Return</div>
            </div>
          </div>
        </div>

        {/* Portfolio Holdings */}
        {portfolio.stocks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">💼</div>
            <h3 className="text-2xl font-semibold text-white mb-4">No Holdings</h3>
            <p className="text-gray-400 mb-8">Your portfolio is empty. Start by adding some stocks!</p>
            <Link
              href="/"
              className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 inline-block"
            >
              Browse Stocks
            </Link>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">📈</span>
              Holdings
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {portfolio.stocks.map((stock, index) => (
                <div 
                  key={stock.symbol} 
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Stock Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-xl font-bold text-white">{stock.symbol}</h4>
                        <span className="text-lg">{getChangeIcon(stock.change || 0)}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {stock.quantity} shares @ {formatCurrency(stock.avgPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Current Price */}
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-white mb-1">
                      {stock.currentPrice ? formatCurrency(stock.currentPrice) : 'N/A'}
                    </div>
                    {stock.change !== undefined && (
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getChangeBgColor(stock.change)} ${getChangeColor(stock.change)}`}>
                        {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)} ({stock.changePercent !== undefined ? (stock.changePercent >= 0 ? '+' : '') + stock.changePercent.toFixed(2) + '%' : 'N/A'})
                      </div>
                    )}
                  </div>

                  {/* Position Details */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Position Value</span>
                      <span className="text-white font-medium">
                        {stock.totalValue ? formatCurrency(stock.totalValue) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Cost</span>
                      <span className="text-white font-medium">
                        {formatCurrency(stock.avgPrice * stock.quantity)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gain/Loss</span>
                      <span className={`font-medium ${getChangeColor(stock.totalGain || 0)}`}>
                        {stock.totalGain !== undefined ? (stock.totalGain >= 0 ? '+' : '') + formatCurrency(stock.totalGain) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Return %</span>
                      <span className={`font-medium ${getChangeColor(stock.totalGainPercent || 0)}`}>
                        {stock.totalGainPercent !== undefined ? (stock.totalGainPercent >= 0 ? '+' : '') + stock.totalGainPercent.toFixed(2) + '%' : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Link
                    href={`/stock/${stock.symbol}`}
                    className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 inline-block text-center group-hover:shadow-lg group-hover:shadow-red-500/25"
                  >
                    View Details →
                  </Link>
            </div>
          ))}
            </div>
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 inline-block shadow-lg hover:shadow-red-500/25"
          >
            ← Back to Dashboard
          </Link>
        </div>
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <ProtectedRoute>
      <PortfolioContent />
    </ProtectedRoute>
  );
}