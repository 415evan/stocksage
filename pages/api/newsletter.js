// pages/api/newsletter.js
import { fetchStockData } from "../../lib/fetchStock";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const symbols = ["ES=F", "NQ=F", "GC=F", "BTC-USD", "CL=F", "^VIX"];
    const results = await Promise.allSettled(symbols.map(s => fetchStockData(s)));
    const marketData = results.map(r => r.status === "fulfilled" ? r.value : null).filter(Boolean);
    const summary = marketData.map(d => `${d.ticker}:$${d.price}(${d.changePercent})`).join(", ");

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        messages: [{ role: "user", content: `Write a daily market briefing for ${new Date().toDateString()}. Markets: ${summary}. Return ONLY JSON: {"date":"${new Date().toDateString()}","headline":"...","openingBell":"...","sections":[{"title":"Futures & Indices","content":"..."},{"title":"Commodities & Gold","content":"..."},{"title":"Crypto","content":"..."},{"title":"Key Levels to Watch","content":"..."},{"title":"Trade of the Day","content":"..."}],"sentiment":"bullish","riskLevel":"medium","riskNote":"..."}` }],
      }),
    });
    const data = await claudeRes.json();
    const text = data.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid response");
    return res.status(200).json({ newsletter: JSON.parse(match[0]), marketData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
