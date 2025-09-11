"use client";

import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Box, Card, CardContent, Typography, Badge } from "@mui/material";

// -----------------
// TypeScript Types
// -----------------
interface Stock {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  lastUpdated: string; // must be string, not Date object
}

// -----------------
// Backend URL
// -----------------
const BACKEND_URL = "http://localhost:4000";

// -----------------
// StockDashboard Component
// -----------------
const StockDashboard: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // -----------------
  // Socket.io Client
  // -----------------
  useEffect(() => {
    const s: Socket = io(BACKEND_URL, { transports: ["websocket", "polling"] });
    setSocket(s);

    s.on("connect", () => console.log("✅ Connected to backend:", s.id));

    s.on("priceUpdate", (data: Stock[]) => {
      const cleanData: Stock[] = data.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        previousClose: stock.previousClose,
        change: stock.change,
        changePercent: stock.changePercent,
        lastUpdated: new Date(stock.lastUpdated).toISOString(),
      }));
      setStocks(cleanData);
    });

    s.on("disconnect", () => console.log("❌ Disconnected from backend"));

    // cleanup on unmount
    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <Box className="p-6 max-w-7xl mx-auto">
      <Typography
        variant="h3"
        component="h1"
        className="mb-6 font-bold text-center"
      >
        📈 Live Stock Dashboard
      </Typography>

      {/* Flexbox Responsive Layout */}
      <Box className="flex flex-wrap -mx-2">
        {stocks.length === 0 && (
          <Typography className="text-center w-full">Loading stocks...</Typography>
        )}

        {stocks.map((stock) => (
          <Box
            key={stock.symbol}
            className="w-full sm:w-1/2 md:w-1/3 px-2 mb-4"
          >
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent>
                <Box className="flex justify-between items-center mb-2">
                  <Typography variant="h6" fontWeight="bold">
                    {stock.symbol}
                  </Typography>
                  <Badge
                    color={
                      stock.change > 0
                        ? "success"
                        : stock.change < 0
                        ? "error"
                        : "default"
                    }
                    badgeContent={
                      stock.change > 0
                        ? "▲"
                        : stock.change < 0
                        ? "▼"
                        : "-"
                    }
                  />
                </Box>

                <Typography variant="subtitle1" color="text.secondary">
                  {stock.name}
                </Typography>

                <Typography variant="h5" fontWeight="bold" className="my-2">
                  ${stock.price.toFixed(2)}
                </Typography>

                <Box className="flex justify-between">
                  <Typography
                    color={
                      stock.change > 0
                        ? "success.main"
                        : stock.change < 0
                        ? "error.main"
                        : "text.primary"
                    }
                  >
                    {stock.change.toFixed(2)}
                  </Typography>

                  <Typography
                    color={
                      stock.changePercent > 0
                        ? "success.main"
                        : stock.changePercent < 0
                        ? "error.main"
                        : "text.primary"
                    }
                  >
                    {stock.changePercent.toFixed(2)}%
                  </Typography>
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="block mt-2 text-right"
                >
                  {new Date(stock.lastUpdated).toLocaleTimeString()}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default StockDashboard;
