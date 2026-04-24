import { fetchStockData } from "../../lib/fetchStock";
import { fetchNews } from "../../lib/fetchNews";
import { buildPriceActionSummary } from "../../lib/priceAction";

function truncate(str, max = 150) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
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
    const [stockData, news] = await Promise.all([
      fetchStockData(clean),
      fetchNews(clean),
    ]);

    const pa = buildPriceActionSummary(stockData.dailyCandles, parseFloat(stockData.price));
    const newsCtx = news.slice(0, 3).map(n => `- "${truncate(n.title, 100)}" (${n.source})`).join("\n") || "No news.";
    const patternCtx = pa.patterns.slice(0, 3).map(p => `- ${p.name} (${p.type})`).join("\n") || "None.";
    const structureCtx = pa.structure
      ? `Trend: ${pa.structure.trend} (${pa.structure.trendStrength}). SwingH: $${pa.structure.lastSwingHigh || "N/A"}, SwingL: $${pa.structure.lastSwingLow || "N/A"}.`
      : "Insufficient data.";
    const srCtx = `R: ${pa.srLevels.resistance.slice(0, 3).join(", ") || "None"}. S: ${pa.srLevels.support.slice(0, 3).join(", ") || "None"}`;
    const techCtx = `$${stockData.price}(${stockData.change}/${stockData.changePercent}) H:$${stockData.high} L:$${stockData.low} MA20:${stockData.ma20 || "N/A"} MA50:${stockData.ma50 || "N/A"} RSI:${stockData.rsi} MACD:${stockData.macd?.hist || "N/A"}`;

    const prompt = `Analyze ${clean} as a professional trader. Return ONLY valid JSON no markdown.
DATA:${techCtx}
STRUCTURE:${structureCtx}
SR:${srCtx}
PATTERNS:${patternCtx}
NEWS:${newsCtx}

Return this EXACT JSON (all strings under 180 chars):
{
  "summary":"2-3 sentence plain English summary of what is happening right now",
  "sentiment":"bullish",
  "prediction":{
    "shortTerm":"1-3 day price outlook with specific target price e.g. Could reach $280 in 1-3 days if holds above $270 support",
    "mediumTerm":"1-2 week outlook with specific target e.g. Path to $290-295 range over next 1-2 weeks if market holds up",
    "bullishTarget":"exact price target if bull case plays out e.g. $288",
    "bearishTarget":"exact price target if bear case plays out e.g. $255",
    "keyLevelToWatch":"the single most important price level right now and why e.g. $270 — this is the 20MA and recent support, losing it turns outlook bearish",
    "upProbability":"estimated % chance price goes up in next 3 days based on technicals e.g. 65%",
    "confidence":"low or medium or high"
  },
  "entryExit":{
    "entryPrice":"$X",
    "entryReason":"...",
    "stopLoss":"$X",
    "stopReason":"...",
    "exit1":"$X",
    "exit1Reason":"...",
    "exit2":"$X",
    "exit2Reason":"...",
    "invalidationNote":"..."
  },
  "tradeSetup":{
    "bias":"bullish",
    "entryZone":"$X-$Y",
    "stopLoss":"$X",
    "target1":"$X",
    "target2":"$X",
    "riskReward":"1:2",
    "timeframe":"both"
  },
  "priceActionRead":"...",
  "structureRead":"...",
  "bullish":"...",
  "bearish":"...",
  "noTradeZone":"...",
  "technicalRead":"...",
  "newsImpact":"...",
  "beginnerWarning":"..."
}`;

    // Stream the response
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1800,
        stream: true,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.json();
      throw new Error(err?.error?.message || "Claude API error");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send stock data immediately so UI can show it right away
    res.write(`data: ${JSON.stringify({ type: "stockData", stockData, news, priceAction: { patterns: pa.patterns, structure: pa.structure, srLevels: pa.srLevels } })}\n\n`);

    let fullText = "";
    const reader = claudeRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              fullText += parsed.delta.text;
              res.write(`data: ${JSON.stringify({ type: "delta", text: parsed.delta.text })}\n\n`);
            }
          } catch (e) {}
        }
      }
    }

    try {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        res.write(`data: ${JSON.stringify({
          type: "complete",
          analysis,
          priceAction: { patterns: pa.patterns, structure: pa.structure, srLevels: pa.srLevels, entryExit: analysis.entryExit },
        })}\n\n`);
      }
    } catch (e) {
      res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to parse analysis" })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();

  } catch (err) {
    console.error("Analyze error:", err.message);
    if (!res.headersSent) return res.status(500).json({ error: err.message });
    res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
    res.end();
  }
}
