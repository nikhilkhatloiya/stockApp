import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3000 }); 

wss.on("connection", (ws) => {
  console.log("Client connected ✅");

  // Send fake price updates every 2s
  setInterval(() => {
    const fakeStock = {
      symbol: "AAPL",
      price: (150 + Math.random() * 10).toFixed(2),
    };
    ws.send(JSON.stringify(fakeStock));
  }, 2000);

  ws.on("close", () => console.log("Client disconnected ❌"));
});
