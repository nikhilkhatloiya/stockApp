"use client";

import { useEffect, useState } from "react";

interface Stock {
  symbol: string;
  quantity: number;
  avgPrice: number;
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const userId = "demo-user";

  useEffect(() => {
    fetch(`http://localhost:3001/api/portfolio/${userId}`)
      .then((res) => res.json())
      .then((data) => setPortfolio(data.stocks || []));
  }, []);

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">My Portfolio</h1>

      {portfolio.length === 0 ? (
        <p>No stocks in portfolio</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portfolio.map((stock) => (
            <div key={stock.symbol} className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{stock.symbol}</h2>
              <p>Quantity: {stock.quantity}</p>
              <p>Avg Price: {stock.avgPrice}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
