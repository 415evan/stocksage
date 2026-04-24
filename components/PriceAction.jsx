// components/PriceAction.jsx
export default function PriceAction({ data }) {
  if (!data) return null;
  const { patterns, structure, srLevels, entryExit } = data;
  const biasColor = structure?.trend==="uptrend"?"#22c55e":structure?.trend==="downtrend"?"#ef4444":"#f59e0b";

  return (
    <div className="pa-container">
      <div className="pa-header">
        <span className="pa-title">🔍 Price Action Analysis</span>
        {structure && <span className="pa-trend-badge" style={{background:biasColor}}>{structure.trend==="uptrend"?"↑":structure.trend==="downtrend"?"↓":"↔"} {structure.trend?.toUpperCase()} · {structure.trendStrength?.toUpperCase()}</span>}
      </div>

      {structure?.breakOfStructure && (
        <div className="bos-alert" style={{borderColor:structure.breakOfStructure.direction==="bullish"?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.4)",background:structure.breakOfStructure.direction==="bullish"?"rgba(34,197,94,0.07)":"rgba(239,68,68,0.07)"}}>
          <span className="bos-icon">{structure.breakOfStructure.direction==="bullish"?"🚀":"⚠️"}</span>
          <div><div className="bos-title">Break of Structure</div><div className="bos-text">{structure.breakOfStructure.note}</div></div>
        </div>
      )}

      {entryExit && (
        <div className="entry-exit-section">
          <div className="section-label">⚡ Exact Entry & Exit Points</div>
          <div className="entry-exit-grid">
            {[["🎯 Entry Point",entryExit.entryPrice,entryExit.entryReason,"#6366f1"],["🛑 Stop Loss",entryExit.stopLoss,entryExit.stopReason,"#ef4444"],["✅ Exit Target 1",entryExit.exit1,entryExit.exit1Reason,"#22c55e"],["🚀 Exit Target 2",entryExit.exit2,entryExit.exit2Reason,"#10b981"]].map(([label,price,reason,color]) => (
              <div key={label} className="ee-box" style={{borderTopColor:color}}>
                <div className="ee-label">{label}</div>
                <div className="ee-price" style={{color}}>{price}</div>
                <div className="ee-reason">{reason}</div>
              </div>
            ))}
          </div>
          {entryExit.invalidationNote && <div className="invalidation-note"><span>🚫</span><div><strong>Trade Invalidated If:</strong> {entryExit.invalidationNote}</div></div>}
        </div>
      )}

      <div className="pa-section">
        <div className="section-label">📐 Market Structure</div>
        <p className="pa-text">{structure?.structureNote}</p>
        {structure?.swingHighs?.length > 0 && (
          <div className="swing-levels">
            <div className="swing-group">
              <span className="swing-label red">Swing Highs</span>
              {structure.swingHighs.map((h,i) => <span key={i} className="swing-price red">${h.price.toFixed(2)}</span>)}
            </div>
            <div className="swing-group">
              <span className="swing-label green">Swing Lows</span>
              {structure.swingLows?.map((l,i) => <span key={i} className="swing-price green">${l.price.toFixed(2)}</span>)}
            </div>
          </div>
        )}
      </div>

      <div className="pa-section">
        <div className="section-label">📊 Support & Resistance</div>
        <div className="sr-grid">
          <div className="sr-col"><div className="sr-col-label red">🔴 Resistance</div>{srLevels?.resistance?.length>0?srLevels.resistance.map((l,i)=><div key={i} className="sr-level red">${l}</div>):<div className="sr-none">None detected</div>}</div>
          <div className="sr-col"><div className="sr-col-label green">🟢 Support</div>{srLevels?.support?.length>0?srLevels.support.map((l,i)=><div key={i} className="sr-level green">${l}</div>):<div className="sr-none">None detected</div>}</div>
        </div>
      </div>

      <div className="pa-section">
        <div className="section-label">🕯️ Candlestick Patterns</div>
        {patterns?.length > 0 ? (
          <div className="patterns-list">
            {patterns.map((p,i) => (
              <div key={i} className="pattern-item" style={{borderLeftColor:p.type==="bullish"?"#22c55e":p.type==="bearish"?"#ef4444":"#f59e0b"}}>
                <div className="pattern-header">
                  <span className="pattern-name" style={{color:p.type==="bullish"?"#22c55e":p.type==="bearish"?"#ef4444":"#f59e0b"}}>{p.type==="bullish"?"▲":p.type==="bearish"?"▼":"◆"} {p.name}</span>
                  <span className="pattern-type" style={{color:p.type==="bullish"?"#22c55e":p.type==="bearish"?"#ef4444":"#f59e0b"}}>{p.type}</span>
                </div>
                <p className="pattern-desc">{p.description}</p>
              </div>
            ))}
          </div>
        ) : <p className="pa-text muted">No major patterns on recent candles.</p>}
      </div>
    </div>
  );
}
