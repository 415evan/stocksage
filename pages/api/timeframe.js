export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "Ticker required" });
  const headers = { "User-Agent": "Mozilla/5.0" };

  async function getQuote(interval, range) {
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/" + ticker + "?interval=" + interval + "&range=" + range;
    const r = await fetch(url, { headers });
    const data = await r.json();
    const result = data && data.chart && data.chart.result && data.chart.result[0];
    if (!result) return null;
    return result;
  }

  function calcChange(currentPrice, startPrice) {
    if (!startPrice || startPrice === 0) return null;
    const change = (currentPrice - startPrice).toFixed(2);
    const changePct = (((currentPrice - startPrice) / startPrice) * 100).toFixed(2);
    return { change, changePct, isUp: parseFloat(change) >= 0 };
  }

  try {
    // Get base quote with meta for current price and previous close
    const baseQuote = await getQuote("1d", "5d");
    if (!baseQuote) return res.status(500).json({ error: "Could not fetch data" });

    const meta = baseQuote.meta;
    const currentPrice = parseFloat(meta.regularMarketPrice);
    const prevClose = parseFloat(meta.chartPreviousClose || meta.regularMarketPreviousClose || meta.previousClose);
    const todayOpen = parseFloat(meta.regularMarketOpen);

    // Get longer range data
    const [mo1, mo3, mo6, y1, y3, y5, max] = await Promise.all([
      getQuote("1d", "1mo"),
      getQuote("1d", "3mo"),
      getQuote("1d", "6mo"),
      getQuote("1d", "1y"),
      getQuote("1wk", "3y"),
      getQuote("1mo", "5y"),
      getQuote("3mo", "max"),
    ]);

    function firstClose(result) {
      if (!result) return null;
      const closes = result.indicators && result.indicators.quote && result.indicators.quote[0] && result.indicators.quote[0].close;
      if (!closes) return null;
      const filtered = closes.filter(c => c != null && c > 0);
      return filtered.length > 0 ? parseFloat(filtered[0]) : null;
    }

    // Get intraday data for short timeframes
    const intraday1d = await getQuote("1m", "1d");
    const intraday5d = await getQuote("5m", "5d");
    const intraday1h = await getQuote("60m", "1mo");

    function intradayChange(result, minutesAgo) {
      if (!result) return null;
      const timestamps = result.timestamp || [];
      const closes = result.indicators && result.indicators.quote && result.indicators.quote[0] && result.indicators.quote[0].close || [];
      const now = Date.now() / 1000;
      const targetTime = now - minutesAgo * 60;
      let bestIdx = 0;
      let bestDiff = Infinity;
      for (let i = 0; i < timestamps.length; i++) {
        const diff = Math.abs(timestamps[i] - targetTime);
        if (diff < bestDiff && closes[i] != null) { bestDiff = diff; bestIdx = i; }
      }
      return closes[bestIdx] ? parseFloat(closes[bestIdx]) : null;
    }

    const timeframes = {
      "1m":  calcChange(currentPrice, intradayChange(intraday1d, 1) || todayOpen),
      "5m":  calcChange(currentPrice, intradayChange(intraday1d, 5) || todayOpen),
      "15m": calcChange(currentPrice, intradayChange(intraday1d, 15) || todayOpen),
      "30m": calcChange(currentPrice, intradayChange(intraday1d, 30) || todayOpen),
      "1h":  calcChange(currentPrice, intradayChange(intraday5d, 60) || todayOpen),
      "4h":  calcChange(currentPrice, intradayChange(intraday5d, 240) || todayOpen),
      "1d":  calcChange(currentPrice, prevClose),
      "1w":  calcChange(currentPrice, firstClose(intraday5d)),
      "1mo": calcChange(currentPrice, firstClose(mo1)),
      "3mo": calcChange(currentPrice, firstClose(mo3)),
      "6mo": calcChange(currentPrice, firstClose(mo6)),
      "1y":  calcChange(currentPrice, firstClose(y1)),
      "3y":  calcChange(currentPrice, firstClose(y3)),
      "5y":  calcChange(currentPrice, firstClose(y5)),
      "all": calcChange(currentPrice, firstClose(max)),
    };

    const labels = { "1m":"1m","5m":"5m","15m":"15m","30m":"30m","1h":"1H","4h":"4H","1d":"1D","1w":"1W","1mo":"1M","3mo":"3M","6mo":"6M","1y":"1Y","3y":"3Y","5y":"5Y","all":"ALL" };

    const result = {};
    for (const [key, val] of Object.entries(timeframes)) {
      result[key] = val
        ? { key, label: labels[key], ...val }
        : { key, label: labels[key], change: null, changePct: null };
    }

    return res.status(200).json({ ticker: ticker.toUpperCase(), timeframes: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
