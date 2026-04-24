// components/TradingViewChart.jsx
import { useEffect, useRef } from "react";

function toTVSymbol(ticker) {
  const map = {
    "ES=F":"CME_MINI:ES1!","NQ=F":"CME_MINI:NQ1!","YM=F":"CBOT_MINI:YM1!",
    "RTY=F":"CME_MINI:RTY1!","CL=F":"NYMEX:CL1!","BZ=F":"ICEEUR:BRN1!",
    "GC=F":"COMEX:GC1!","SI=F":"COMEX:SI1!","HG=F":"COMEX:HG1!",
    "NG=F":"NYMEX:NG1!","ZW=F":"CBOT:ZW1!","ZC=F":"CBOT:ZC1!",
    "^GSPC":"SP:SPX","^IXIC":"NASDAQ:COMP","^DJI":"DJ:DJI",
    "^RUT":"RUSSELL:RUT","^VIX":"CBOE:VIX","^FTSE":"LSE:UKX",
    "^GDAXI":"XETR:DAX","^N225":"INDEX:NKY","^HSI":"HSI:HSI",
    "EURUSD=X":"FX:EURUSD","GBPUSD=X":"FX:GBPUSD","USDJPY=X":"FX:USDJPY",
    "AUDUSD=X":"FX:AUDUSD","USDCAD=X":"FX:USDCAD","USDCHF=X":"FX:USDCHF",
    "NZDUSD=X":"FX:NZDUSD","EURGBP=X":"FX:EURGBP","DX-Y.NYB":"TVC:DXY",
    "BTC-USD":"BINANCE:BTCUSDT","ETH-USD":"BINANCE:ETHUSDT","SOL-USD":"BINANCE:SOLUSDT",
    "BNB-USD":"BINANCE:BNBUSDT","XRP-USD":"BINANCE:XRPUSDT","ADA-USD":"BINANCE:ADAUSDT",
    "AVAX-USD":"BINANCE:AVAXUSDT","DOGE-USD":"BINANCE:DOGEUSDT","DOT-USD":"BINANCE:DOTUSDT",
  };
  return map[ticker] || ticker;
}

export default function TradingViewChart({ ticker, priceAction }) {
  const containerRef = useRef(null);
  const tvSymbol = toTVSymbol(ticker);
  const tvLink = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;
  const entryExit = priceAction?.entryExit;
  const patterns = priceAction?.patterns || [];
  const structure = priceAction?.structure;

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.text = JSON.stringify({
      width: "100%", height: "460",
      symbol: tvSymbol,
      interval: "D",
      timezone: "America/New_York",
      theme: "dark", style: "1", locale: "en",
      backgroundColor: "#111118",
      gridColor: "#1a1a2e",
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: false,
      save_image: false,
      studies: ["STD;RSI", "STD;MACD"],
    });
    containerRef.current.appendChild(script);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ""; };
  }, [tvSymbol]);

  return (
    <div className="tv-wrapper">
      <div className="tv-header">
        <div className="tv-title-row">
          <span className="tv-label">📈 Live Chart</span>
          <span className="tv-symbol-badge">{tvSymbol}</span>
        </div>
        <a href={tvLink} target="_blank" rel="noopener noreferrer" className="tv-open-btn">
          Open in TradingView ↗
        </a>
      </div>

      {entryExit && (
        <div className="ee-beginner-bar">
          <div className="ee-beginner-title">🤖 AI Trade Levels</div>
          <div className="ee-beginner-cards">
            <div className="ee-card entry">
              <div className="ee-card-arrow">▲</div>
              <div className="ee-card-label">Enter here</div>
              <div className="ee-card-price">{entryExit.entryPrice}</div>
              <div className="ee-card-hint">{entryExit.entryReason?.slice(0, 80)}</div>
            </div>
            <div className="ee-card stop">
              <div className="ee-card-arrow">✕</div>
              <div className="ee-card-label">Stop loss</div>
              <div className="ee-card-price">{entryExit.stopLoss}</div>
              <div className="ee-card-hint">{entryExit.stopReason?.slice(0, 80)}</div>
            </div>
            <div className="ee-card target1">
              <div className="ee-card-arrow">★</div>
              <div className="ee-card-label">Take profit 1</div>
              <div className="ee-card-price">{entryExit.exit1}</div>
              <div className="ee-card-hint">{entryExit.exit1Reason?.slice(0, 80)}</div>
            </div>
            <div className="ee-card target2">
              <div className="ee-card-arrow">★★</div>
              <div className="ee-card-label">Take profit 2</div>
              <div className="ee-card-price">{entryExit.exit2}</div>
              <div className="ee-card-hint">{entryExit.exit2Reason?.slice(0, 80)}</div>
            </div>
          </div>
          {structure?.trend && (
            <div className={`trend-pill ${structure.trend}`}>
              {structure.trend === "uptrend" ? "↑ Uptrend" : structure.trend === "downtrend" ? "↓ Downtrend" : "↔ Sideways"} · {structure.trendStrength} strength
            </div>
          )}
          {entryExit.invalidationNote && (
            <div className="invalidation-bar">🚫 <strong>Cancel trade if:</strong> {entryExit.invalidationNote}</div>
          )}
        </div>
      )}

      <div ref={containerRef} style={{ width: "100%", minHeight: "460px", background: "#111118" }} />

      {patterns.length > 0 && (
        <div className="tv-patterns-row">
          <span className="tv-patterns-label">🕯 Detected:</span>
          {patterns.map((p, i) => (
            <span key={i} className="pattern-pill" style={{
              background: p.type==="bullish"?"rgba(34,197,94,0.15)":p.type==="bearish"?"rgba(239,68,68,0.15)":"rgba(245,158,11,0.15)",
              color: p.type==="bullish"?"#22c55e":p.type==="bearish"?"#ef4444":"#f59e0b",
            }}>
              {p.type==="bullish"?"▲":p.type==="bearish"?"▼":"◆"} {p.name}
            </span>
          ))}
        </div>
      )}
      <p className="tv-note">Chart by TradingView · AI levels by StockSage · Not financial advice</p>
    </div>
  );
}
