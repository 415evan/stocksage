// lib/markets.js
export const MARKETS = {
  futures: {
    label: "Futures", icon: "📊",
    items: [
      { symbol: "ES=F", name: "S&P 500 E-Mini", desc: "CME S&P 500 Futures" },
      { symbol: "NQ=F", name: "Nasdaq-100 E-Mini", desc: "CME Nasdaq Futures" },
      { symbol: "YM=F", name: "Dow E-Mini", desc: "CME Dow Futures" },
      { symbol: "RTY=F", name: "Russell 2000", desc: "CME Russell Futures" },
      { symbol: "CL=F", name: "Crude Oil WTI", desc: "NYMEX Oil Futures" },
      { symbol: "GC=F", name: "Gold", desc: "COMEX Gold Futures" },
      { symbol: "SI=F", name: "Silver", desc: "COMEX Silver Futures" },
      { symbol: "NG=F", name: "Natural Gas", desc: "NYMEX Gas Futures" },
    ],
  },
  indices: {
    label: "Indices", icon: "📈",
    items: [
      { symbol: "^GSPC", name: "S&P 500", desc: "US Large Cap" },
      { symbol: "^IXIC", name: "Nasdaq", desc: "US Tech Index" },
      { symbol: "^DJI", name: "Dow Jones", desc: "US Blue Chip" },
      { symbol: "^VIX", name: "VIX", desc: "Fear Gauge" },
      { symbol: "^FTSE", name: "FTSE 100", desc: "UK Index" },
      { symbol: "^GDAXI", name: "DAX", desc: "German Index" },
      { symbol: "^N225", name: "Nikkei 225", desc: "Japan Index" },
    ],
  },
  forex: {
    label: "Forex", icon: "💱",
    items: [
      { symbol: "EURUSD=X", name: "EUR/USD", desc: "Euro / Dollar" },
      { symbol: "GBPUSD=X", name: "GBP/USD", desc: "Pound / Dollar" },
      { symbol: "USDJPY=X", name: "USD/JPY", desc: "Dollar / Yen" },
      { symbol: "AUDUSD=X", name: "AUD/USD", desc: "Aussie / Dollar" },
      { symbol: "USDCAD=X", name: "USD/CAD", desc: "Dollar / Canadian" },
      { symbol: "DX-Y.NYB", name: "DXY", desc: "US Dollar Index" },
    ],
  },
  crypto: {
    label: "Crypto", icon: "₿",
    items: [
      { symbol: "BTC-USD", name: "Bitcoin", desc: "BTC / USD" },
      { symbol: "ETH-USD", name: "Ethereum", desc: "ETH / USD" },
      { symbol: "SOL-USD", name: "Solana", desc: "SOL / USD" },
      { symbol: "BNB-USD", name: "BNB", desc: "Binance Coin" },
      { symbol: "XRP-USD", name: "XRP", desc: "Ripple / USD" },
      { symbol: "DOGE-USD", name: "Dogecoin", desc: "DOGE / USD" },
    ],
  },
  stocks: {
    label: "Stocks", icon: "🏢",
    items: [
      { symbol: "AAPL", name: "Apple", desc: "Technology" },
      { symbol: "MSFT", name: "Microsoft", desc: "Technology" },
      { symbol: "NVDA", name: "Nvidia", desc: "Semiconductors" },
      { symbol: "GOOGL", name: "Alphabet", desc: "Technology" },
      { symbol: "AMZN", name: "Amazon", desc: "E-Commerce" },
      { symbol: "META", name: "Meta", desc: "Social Media" },
      { symbol: "TSLA", name: "Tesla", desc: "EV / Tech" },
      { symbol: "SPY", name: "SPY ETF", desc: "S&P 500 ETF" },
    ],
  },
};

export const SYMBOL_MAP = Object.values(MARKETS)
  .flatMap(cat => cat.items)
  .reduce((acc, item) => { acc[item.symbol] = item; return acc; }, {});
