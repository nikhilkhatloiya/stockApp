"use client";

import { useSocket } from "./hooks/useSocket";

export default function Home() {
  const prices = useSocket();

  return (
    <main style={{ padding: "20px" }}>
      <h1>📊 Real-Time Stock Dashboard</h1>
      {prices.length === 0 ? (
        <p>Waiting for data...</p>
      ) : (
        <ul>
          {prices.map((stock: any) => (
            <li key={stock.symbol}>
              {stock.symbol}: <b>{stock.price}</b>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
