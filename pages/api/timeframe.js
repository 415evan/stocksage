export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "Ticker required" });
  const headers = { "User-Agent": "Mozilla/5.0" };
  const timeframes = [
    { key: "1m", interval: "1m", range: "1d", label: "1m" },
    { key: "5m", interval: "5m", range: "1d", label: "5m" },
    { key: "15m", interval: "15m", range: "5d", label: "15m" },
    { key: "30m", interval: "30m", range: "5d", label: "30m" },
    { key: "1h", interval: "60m", range: "1mo", label: "1H" },
    { key: "4h", interval: "60m", range: "3mo", label: "4H" },
    { key: "1d", interval: "1d", range: "1y", label: "1D" },
    { key: "1w", interval: "1wk", range: "2y", label: "1W" },
    { key: "1mo", interval: "1mo", range: "5y", label: "1M" },
    { key: "3mo", interval: "3mo", range: "10y", label: "3M" },
    { key: "6mo", interval: "3mo", range: "max", label: "6M" },
    { key: "1y", interval: "3mo", range: "max", label: "1Y" },
    { key: "3y", interval: "3mo", range: "max", label: "3Y" },
    { key: "5y", interval: "3mo", range: "max", label: "5Y" },
    { key: "all", interval: "3mo", range: "max", label: "ALL" },
  ];
  const results = await Promise.allSettled(timeframes.map(async (tf) => {
    try {
      const url = "https://query1.finance.yahoo.com/v8/finance/chart/" + ticker + "?interval=" + tf.interval + "&range=" + tf.range;
      const r = await fetch(url, { headers });
      const data = await r.json();
      const result = data && data.chart && data.chart.result && data.chart.result[0];
      if (!result) return { key: tf.key, label: tf.label, change: null, changePct: null };
      const meta = result.meta;
      const closes = (result.indicators && result.indicators.quote && result.indicators.quote[0] && result.indicators.quote[0].close || []).filter(Boolean);
      if (closes.length < 2) return { key: tf.key, label: tf.label, change: null, changePct: null };
      const currentPrice = parseFloat(meta.regularMarketPrice || closes[closes.length - 1]);
      let startPrice;
      if (tf.key === "1m" || tf.key === "5m") startPrice = parseFloat(meta.regularMarketOpen || closes[0]);
      else if (tf.key === "4h") startPrice = parseFloat(closes[Math.max(0, closes.length - 5)]);
      else startPrice = parseFloat(closes[0]);
      if (!startPrice || startPrice === 0) return { key: tf.key, label: tf.label, change: null, changePct: null };
      const change = (currentPrice - startPrice).toFixed(2);
      const changePct = (((currentPrice - startPrice) / startPrice) * 100).toFixed(2);
      return { key: tf.key, label: tf.label, change, changePct, isUp: parseFloat(change) >= 0 };
    } catch (e) {
      return { key: tf.key, label: tf.label, change: null, changePct: null };
    }
  }));
  const timeframeData = {};
  results.forEach(function(r, i) {
    const tf = timeframes[i];
    timeframeData[tf.key] = (r.status === "fulfilled" && r.value) ? r.value : { key: tf.key, label: tf.label, change: null, changePct: null };
  });
  return res.status(200).json({ ticker: ticker.toUpperCase(), timeframes: timeframeData });
}
