import { useState, useEffect } from "react";
const TIMEFRAMES = [
  { key: "1m", label: "1m" }, { key: "5m", label: "5m" },
  { key: "15m", label: "15m" }, { key: "30m", label: "30m" },
  { key: "1h", label: "1H" }, { key: "4h", label: "4H" },
  { key: "1d", label: "1D" }, { key: "1w", label: "1W" },
  { key: "1mo", label: "1M" }, { key: "3mo", label: "3M" },
  { key: "6mo", label: "6M" }, { key: "1y", label: "1Y" },
  { key: "3y", label: "3Y" }, { key: "5y", label: "5Y" },
  { key: "all", label: "ALL" },
];
export default function StockCard({ data, assetInfo }) {
  const [activeFrame, setActiveFrame] = useState("1d");
  const [tfData, setTfData] = useState(null);
  const [tfLoading, setTfLoading] = useState(false);
  const todayIsUp = parseFloat(data.change) >= 0;
  useEffect(() => {
    if (!data.ticker) return;
    setTfLoading(true);
    fetch(`/api/timeframe?ticker=${data.ticker}`)
      .then(r => r.json())
      .then(d => { if (d.timeframes) setTfData(d.timeframes); })
      .catch(() => {})
      .finally(() => setTfLoading(false));
  }, [data.ticker]);
  const activeTf = tfData?.[activeFrame];
  const displayChange = activeTf?.change ?? data.change;
  const displayChangePct = activeTf?.changePct ?? data.changePercent?.replace("%", "");
  const displayIsUp = activeTf ? activeTf.isUp : todayIsUp;
  return (
    <div className="stock-card-full">
      <div className="stock-top-row">
        <div className="stock-left">
          <span className="ticker-badge">{data.ticker}</span>
          <div className="mini-name-group">
            <span className="company-short">{assetInfo?.name || data.companyName}</span>
            {assetInfo?.desc && <span className="asset-desc">{assetInfo.desc}</span>}
          </div>
        </div>
        <div className="stock-right">
          <div className="stock-price-big">${data.price}</div>
          <div className={`stock-change-big ${displayIsUp ? "up" : "down"}`}>
            {displayIsUp ? "▲" : "▼"} {Math.abs(parseFloat(displayChange)).toFixed(2)} ({Math.abs(parseFloat(displayChangePct)).toFixed(2)}%)
          </div>
          <div className="tf-label-active">{TIMEFRAMES.find(t => t.key === activeFrame)?.label} change</div>
        </div>
      </div>
      <div className="tf-selector">
        {TIMEFRAMES.map(tf => {
          const tfItem = tfData?.[tf.key];
          const pct = tfItem?.changePct;
          const isUp = tfItem?.isUp;
          return (
            <button key={tf.key} className={`tf-btn ${activeFrame === tf.key ? "active" : ""} ${pct !== null && pct !== undefined ? (isUp ? "tf-up" : "tf-down") : ""}`} onClick={() => setActiveFrame(tf.key)} disabled={tfLoading}>
              <span className="tf-btn-label">{tf.label}</span>
              {pct !== null && pct !== undefined && !tfLoading && <span className={`tf-btn-pct ${isUp ? "up" : "down"}`}>{isUp ? "+" : ""}{parseFloat(pct).toFixed(1)}%</span>}
              {tfLoading && <span className="tf-btn-pct loading">...</span>}
            </button>
          );
        })}
      </div>
      <div className="stock-stats-row">
        {[["Open",`$${data.open}`],["High",`$${data.high}`],["Low",`$${data.low}`],["Vol",data.volume],["52W H",`$${data.week52High}`],["52W L",`$${data.week52Low}`]].map(([l,v]) => (
          <div key={l} className="mini-stat">
            <span className="mini-stat-label">{l}</span>
            <span className="mini-stat-value">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
