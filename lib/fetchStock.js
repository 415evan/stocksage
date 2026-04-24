// lib/fetchStock.js
export async function fetchStockData(ticker) {
  const headers = { "User-Agent": "Mozilla/5.0" };
  const [quoteRes, intradayRes] = await Promise.all([
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=6mo`, { headers }),
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=5m&range=5d`, { headers }),
  ]);
  const quoteData = await quoteRes.json();
  const intradayData = await intradayRes.json();
  if (quoteData.chart?.error || !quoteData.chart?.result?.[0])
    throw new Error(`No data found for "${ticker}".`);

  const result = quoteData.chart.result[0];
  const meta = result.meta;
  const timestamps = result.timestamp || [];
  const ohlcv = result.indicators?.quote?.[0] || {};

  const dailyCandles = timestamps.map((t, i) => ({
    time: new Date(t * 1000).toISOString().split("T")[0],
    open: parseFloat((ohlcv.open?.[i] || 0).toFixed(2)),
    high: parseFloat((ohlcv.high?.[i] || 0).toFixed(2)),
    low: parseFloat((ohlcv.low?.[i] || 0).toFixed(2)),
    close: parseFloat((ohlcv.close?.[i] || 0).toFixed(2)),
    volume: ohlcv.volume?.[i] || 0,
  })).filter(c => c.open && c.high && c.low && c.close);

  let intradayCandles = [];
  const ir = intradayData.chart?.result?.[0];
  if (ir) {
    const iTs = ir.timestamp || [];
    const iQ = ir.indicators?.quote?.[0] || {};
    intradayCandles = iTs.map((t, i) => ({
      time: t,
      open: parseFloat((iQ.open?.[i] || 0).toFixed(2)),
      high: parseFloat((iQ.high?.[i] || 0).toFixed(2)),
      low: parseFloat((iQ.low?.[i] || 0).toFixed(2)),
      close: parseFloat((iQ.close?.[i] || 0).toFixed(2)),
      volume: iQ.volume?.[i] || 0,
    })).filter(c => c.open && c.high && c.low && c.close);
  }

  const closes = dailyCandles.map(c => c.close);
  const highs = dailyCandles.map(c => c.high);
  const lows = dailyCandles.map(c => c.low);
  const recentHigh = Math.max(...highs.slice(-20)).toFixed(2);
  const recentLow = Math.min(...lows.slice(-20)).toFixed(2);
  const ma20 = closes.length >= 20 ? (closes.slice(-20).reduce((a, b) => a + b, 0) / 20).toFixed(2) : null;
  const ma50 = closes.length >= 50 ? (closes.slice(-50).reduce((a, b) => a + b, 0) / 50).toFixed(2) : null;
  const rsi = calcRSI(closes, 14);
  const macd = calcMACD(closes);
  const currentPrice = parseFloat(meta.regularMarketPrice || closes[closes.length - 1] || 0);
  // Fix: always use regularMarketPreviousClose or chartPreviousClose from meta
  // Never fall back to daily candle closes — those are end-of-day prices, not yesterday's close
  const prevClose = parseFloat(
    meta.regularMarketPreviousClose ||
    meta.chartPreviousClose ||
    meta.previousClose ||
    0
  );
  const change = prevClose ? (currentPrice - prevClose).toFixed(2) : "0.00";
  const changePct = prevClose ? (((currentPrice - prevClose) / prevClose) * 100).toFixed(2) : "0.00";

  return {
    ticker: ticker.toUpperCase(),
    companyName: meta.longName || meta.shortName || ticker.toUpperCase(),
    price: currentPrice.toFixed(2),
    change, changePercent: `${changePct}%`,
    open: parseFloat(meta.regularMarketOpen || dailyCandles.at(-1)?.open || 0).toFixed(2),
    high: parseFloat(meta.regularMarketDayHigh || recentHigh).toFixed(2),
    low: parseFloat(meta.regularMarketDayLow || recentLow).toFixed(2),
    volume: (meta.regularMarketVolume || 0).toLocaleString(),
    week52High: parseFloat(meta.fiftyTwoWeekHigh || recentHigh).toFixed(2),
    week52Low: parseFloat(meta.fiftyTwoWeekLow || recentLow).toFixed(2),
    resistance: recentHigh, support: recentLow, ma20, ma50,
    rsi: rsi ? rsi.toFixed(1) : "N/A",
    macd: macd ? { macd: macd.macd.toFixed(3), signal: macd.signal.toFixed(3), hist: macd.hist.toFixed(3) } : null,
    dailyCandles, intradayCandles,
  };
}

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) { const d = closes[i] - closes[i - 1]; if (d >= 0) gains += d; else losses -= d; }
  let ag = gains / period, al = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}

function calcEMA(data, period) {
  if (data.length < period) return data[data.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) ema = data[i] * k + ema * (1 - k);
  return ema;
}

function calcMACD(closes) {
  if (closes.length < 26) return null;
  const ema12 = calcEMA(closes, 12), ema26 = calcEMA(closes, 26);
  const macdLine = ema12 - ema26;
  const signal = calcEMA(closes.slice(-35).map((_, i, a) => calcEMA(a.slice(0, i + 1), 12) - calcEMA(a.slice(0, i + 1), 26)), 9);
  return { macd: macdLine, signal, hist: macdLine - signal };
}
