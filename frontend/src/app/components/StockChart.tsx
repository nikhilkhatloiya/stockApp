import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface StockHistoryEntry {
  price: number;
  timestamp: string;
}

interface StockChartProps {
  symbol: string;
  history: StockHistoryEntry[];
}

const StockChart: React.FC<StockChartProps> = ({ symbol, history }) => {
  const data = history.map((entry) => ({
    price: entry.price,
    time: new Date(entry.timestamp).toLocaleTimeString()
  }));

  return (
    <div className="my-4 p-4 border rounded shadow">
      <h3 className="text-xl font-bold mb-2">{symbol} Price History</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
