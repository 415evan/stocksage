// lib/priceAction.js
export function detectCandlePatterns(candles) {
  if (!candles || candles.length < 3) return [];
  const p = [];
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];
  const body = c => Math.abs(c.close - c.open);
  const range = c => c.high - c.low;
  const isBull = c => c.close > c.open;
  const isBear = c => c.close < c.open;
  const uw = c => c.high - Math.max(c.open, c.close);
  const lw = c => Math.min(c.open, c.close) - c.low;

  if (range(last) > 0 && body(last) / range(last) < 0.1)
    p.push({ name: "Doji", type: "neutral", description: "Market indecision — open and close nearly equal. Often signals reversal." });
  if (lw(last) > body(last) * 2 && uw(last) < body(last) && range(last) > 0)
    p.push({ name: "Hammer", type: "bullish", description: "Long lower wick — buyers rejected lower prices strongly. Bullish reversal." });
  if (uw(last) > body(last) * 2 && lw(last) < body(last) && range(last) > 0)
    p.push({ name: "Shooting Star", type: "bearish", description: "Long upper wick — sellers rejected higher prices. Bearish reversal." });
  if (isBear(prev) && isBull(last) && last.open < prev.close && last.close > prev.open)
    p.push({ name: "Bullish Engulfing", type: "bullish", description: "Green candle engulfs prior red — buyers took control." });
  if (isBull(prev) && isBear(last) && last.open > prev.close && last.close < prev.open)
    p.push({ name: "Bearish Engulfing", type: "bearish", description: "Red candle engulfs prior green — sellers took control." });
  if (isBear(prev2) && body(prev) < body(prev2) * 0.5 && isBull(last) && last.close > (prev2.open + prev2.close) / 2)
    p.push({ name: "Morning Star", type: "bullish", description: "Three-candle bullish reversal pattern." });
  if (isBull(prev2) && body(prev) < body(prev2) * 0.5 && isBear(last) && last.close < (prev2.open + prev2.close) / 2)
    p.push({ name: "Evening Star", type: "bearish", description: "Three-candle bearish reversal pattern." });
  if (last.high < prev.high && last.low > prev.low)
    p.push({ name: "Inside Bar", type: "neutral", description: "Consolidation — breakout coming in either direction." });
  return p;
}

export function analyzeTrendStructure(candles) {
  if (!candles || candles.length < 10) return null;
  const recent = candles.slice(-20);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);
  const swingHighs = [], swingLows = [];
  for (let i = 2; i < recent.length - 2; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && highs[i] > highs[i+1] && highs[i] > highs[i+2])
      swingHighs.push({ price: highs[i], time: recent[i].time });
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && lows[i] < lows[i+1] && lows[i] < lows[i+2])
      swingLows.push({ price: lows[i], time: recent[i].time });
  }
  let trend = "sideways", trendStrength = "weak", breakOfStructure = null, structureNote = "";
  if (swingHighs.length >= 2 && swingLows.length >= 2) {
    const [h0, h1] = swingHighs.slice(-2);
    const [l0, l1] = swingLows.slice(-2);
    if (h1.price > h0.price && l1.price > l0.price) { trend = "uptrend"; trendStrength = "strong"; structureNote = `Higher highs and higher lows confirm uptrend.`; }
    else if (h1.price < h0.price && l1.price < l0.price) { trend = "downtrend"; trendStrength = "strong"; structureNote = `Lower highs and lower lows confirm downtrend.`; }
    else { trend = "sideways"; trendStrength = "none"; structureNote = "No clear trend — range-bound market."; }
    const lastClose = recent[recent.length - 1].close;
    const lsh = swingHighs[swingHighs.length - 1]?.price;
    const lsl = swingLows[swingLows.length - 1]?.price;
    if (trend === "downtrend" && lastClose > lsh)
      breakOfStructure = { direction: "bullish", note: `Price broke above $${lsh?.toFixed(2)} — possible reversal up.` };
    else if (trend === "uptrend" && lastClose < lsl)
      breakOfStructure = { direction: "bearish", note: `Price broke below $${lsl?.toFixed(2)} — possible reversal down.` };
  }
  return {
    trend, trendStrength, structureNote, breakOfStructure,
    swingHighs: swingHighs.slice(-3), swingLows: swingLows.slice(-3),
    lastSwingHigh: swingHighs[swingHighs.length - 1]?.price.toFixed(2) || null,
    lastSwingLow: swingLows[swingLows.length - 1]?.price.toFixed(2) || null,
  };
}

export function detectSRLevels(candles) {
  if (!candles || candles.length < 20) return { support: [], resistance: [] };
  const currentPrice = candles[candles.length - 1].close;
  const tol = currentPrice * 0.005;
  function cluster(prices) {
    const sorted = [...prices].sort((a, b) => a - b);
    const clusters = [];
    let cur = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - cur[cur.length - 1] < tol) cur.push(sorted[i]);
      else { if (cur.length >= 2) clusters.push(parseFloat((cur.reduce((a, b) => a + b, 0) / cur.length).toFixed(2))); cur = [sorted[i]]; }
    }
    return clusters;
  }
  return {
    resistance: cluster(candles.map(c => c.high)).filter(l => l > currentPrice).slice(0, 3),
    support: cluster(candles.map(c => c.low)).filter(l => l < currentPrice).slice(-3).reverse(),
  };
}

export function buildPriceActionSummary(candles, currentPrice) {
  return {
    patterns: detectCandlePatterns(candles),
    structure: analyzeTrendStructure(candles),
    srLevels: detectSRLevels(candles),
    currentPrice,
  };
}
