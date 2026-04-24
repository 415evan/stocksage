import { fetchStockData } from "../../lib/fetchStock";
import { fetchNews } from "../../lib/fetchNews";
import { buildPriceActionSummary } from "../../lib/priceAction";

function truncate(str, max = 150) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
}

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Claude API error");
  }
  const data = await res.json();
  const text = data.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude did not return valid JSON");
  return JSON.parse(match[0]);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { ticker } = req.body;
  if (!ticker) return res.status(400).json({ error: "Ticker required" });
  const clean = ticker.trim().toUpperCase();

  try {
    const [stockData, news] = await Promise.all([fetchStockData(clean), fetchNews(clean)]);
    const pa = buildPriceActionSummary(stockData.dailyCandles, parseFloat(stockData.price));

    const newsCtx = news.slice(0, 3).map(n => `- "${truncate(n.title, 100)}" (${n.source})`).join("\n") || "No news.";
    const patternCtx = pa.patterns.slice(0, 3).map(p => `- ${p.name} (${p.type})`).join("\n") || "None.";
    const structureCtx = pa.structure
      ? `Trend: ${pa.structure.trend} (${pa.structure.trendStrength}). SwingH: $${pa.structure.lastSwingHigh || "N/A"}, SwingL: $${pa.structure.lastSwingLow || "N/A"}.`
      : "Insufficient data.";
    const srCtx = `R: ${pa.srLevels.resistance.slice(0, 3).join(", ") || "None"}. S: ${pa.srLevels.support.slice(0, 3).join(", ") || "None"}`;
    const techCtx = `$${stockData.price}(${stockData.change}/${stockData.changePercent}) H:$${stockData.high} L:$${stockData.low} MA20:${stockData.ma20 || "N/A"} MA50:${stockData.ma50 || "N/A"} RSI:${stockData.rsi} MACD:${stockData.macd?.hist || "N/A"}`;

    const analysis = await callClaude(`Analyze ${clean} as a professional trader. Return ONLY valid JSON no markdown.
DATA:${techCtx}
STRUCTURE:${structureCtx}
SR:${srCtx}
PATTERNS:${patternCtx}
NEWS:${newsCtx}
JSON(all strings under 180 chars):{"summary":"...","sentiment":"bullish","entryExit":{"entryPrice":"$X","entryReason":"...","stopLoss":"$X","stopReason":"...","exit1":"$X","exit1Reason":"...","exit2":"$X","exit2Reason":"...","invalidationNote":"..."},"tradeSetup":{"bias":"bullish","entryZone":"$X-$Y","stopLoss":"$X","target1":"$X","target2":"$X","riskReward":"1:2","timeframe":"both"},"priceActionRead":"...","structureRead":"...","bullish":"...","bearish":"...","noTradeZone":"...","technicalRead":"...","newsImpact":"...","beginnerWarning":"..."}`);

    return res.status(200).json({
      stockData, analysis, news,
      priceAction: { patterns: pa.patterns, structure: pa.structure, srLevels: pa.srLevels, entryExit: analysis.entryExit },
    });
  } catch (err) {
    console.error("Analyze error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
