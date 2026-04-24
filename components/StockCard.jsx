// components/StockCard.jsx
export default function StockCard({ data, assetInfo }) {
  const isUp = parseFloat(data.change) >= 0;
  return (
    <div className="stock-mini-row">
      <div className="mini-left">
        <span className="ticker-badge">{data.ticker}</span>
        <div className="mini-name-group">
          <span className="company-short">{assetInfo?.name || data.companyName}</span>
          {assetInfo?.desc && <span className="asset-desc">{assetInfo.desc}</span>}
        </div>
      </div>
      <div className="mini-right">
        <div className="mini-price-row">
          <span className="mini-price">${data.price}</span>
          <span className={`mini-change ${isUp ? "up" : "down"}`}>{isUp ? "▲" : "▼"} {data.change} ({data.changePercent})</span>
        </div>
        <div className="mini-stats">
          {[["Vol", data.volume],["High",`$${data.high}`],["Low",`$${data.low}`],["52W H",`$${data.week52High}`],["52W L",`$${data.week52Low}`]].map(([l,v]) => (
            <div key={l} className="mini-stat">
              <span className="mini-stat-label">{l}</span>
              <span className="mini-stat-value">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
