// pages/api/live-prices.js
const SYMBOLS = {
  futures: ["ES=F","NQ=F","YM=F","CL=F","GC=F"],
  indices: ["^GSPC","^IXIC","^DJI","^VIX"],
  crypto: ["BTC-USD","ETH-USD","SOL-USD"],
  forex: ["EURUSD=X","GBPUSD=X","USDJPY=X"],
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const all = Object.values(SYMBOLS).flat();
    const results = await Promise.allSettled(all.map(async sym => {
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1m&range=1d`, { headers: { "User-Agent": "Mozilla/5.0" } });
      const data = await r.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) return null;
      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose || meta.previousClose;
      const change = prev ? (price - prev).toFixed(2) : "0";
      const changePct = prev ? (((price - prev) / prev) * 100).toFixed(2) : "0";
      return { symbol: sym, price: price?.toFixed(2) || "N/A", change, changePct, isUp: parseFloat(change) >= 0, name: meta.longName || meta.shortName || sym };
    }));
    const prices = {};
    all.forEach((sym, i) => { if (results[i].status === "fulfilled" && results[i].value) prices[sym] = results[i].value; });
    return res.status(200).json({ prices, categories: SYMBOLS, timestamp: Date.now() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
