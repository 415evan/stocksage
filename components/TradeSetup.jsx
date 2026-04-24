// components/TradeSetup.jsx
export default function TradeSetup({ setup, sentiment }) {
  const color = setup.bias==="bullish"?"#22c55e":setup.bias==="bearish"?"#ef4444":"#f59e0b";
  const emoji = setup.bias==="bullish"?"🐂":setup.bias==="bearish"?"🐻":"😐";
  return (
    <div className="trade-setup-card">
      <div className="setup-header">
        <span className="setup-title">⚡ Trade Setup</span>
        <span className="setup-badge" style={{background:color}}>{emoji} {setup.bias?.toUpperCase()} BIAS</span>
        <span className="timeframe-badge">{setup.timeframe}</span>
      </div>
      <div className="setup-grid">
        {[["🎯 Entry Zone",setup.entryZone,"#6366f1","Ideal price range to enter"],["🛑 Stop Loss",setup.stopLoss,"#ef4444","Exit here if wrong"],["✅ Target 1",setup.target1,"#22c55e","First profit level"],["🚀 Target 2",setup.target2,"#10b981","Extended target"]].map(([label,value,c,desc]) => (
          <div key={label} className="setup-box" style={{borderTopColor:c}}>
            <div className="setup-box-label">{label}</div>
            <div className="setup-box-value" style={{color:c}}>{value}</div>
            <div className="setup-box-desc">{desc}</div>
          </div>
        ))}
      </div>
      <div className="risk-reward-bar">
        <span className="rr-label">Risk / Reward</span>
        <span className="rr-value">{setup.riskReward}</span>
        <span className="rr-hint">{setup.riskReward && parseFloat(setup.riskReward.split(":")[1])>=2?"✅ Good setup":"⚠️ Consider carefully"}</span>
      </div>
    </div>
  );
}
