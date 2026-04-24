// components/Analysis.jsx
export default function Analysis({ data }) {
  const color = data.sentiment==="bullish"?"#22c55e":data.sentiment==="bearish"?"#ef4444":"#f59e0b";
  const emoji = data.sentiment==="bullish"?"🐂":data.sentiment==="bearish"?"🐻":"😐";
  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <span className="ai-badge">✦ AI Analysis</span>
        <span className="sentiment-tag" style={{background:color}}>{emoji} {data.sentiment?.toUpperCase()}</span>
      </div>
      {[
        ["📰","What's Happening","#6366f1",data.summary],
        ["📊","Technical Read","#818cf8",data.technicalRead],
        ["🗞️","News Impact","#a78bfa",data.newsImpact],
        ["🐂","Bullish Scenario","#22c55e",data.bullish],
        ["🐻","Bearish Scenario","#ef4444",data.bearish],
        ["🚫","No-Trade Zone","#f59e0b",data.noTradeZone],
      ].map(([icon,title,c,text]) => (
        <div key={title} className="analysis-section" style={{borderLeftColor:c}}>
          <div className="section-title" style={{color:c}}>{icon} {title}</div>
          <p className="section-text">{text}</p>
        </div>
      ))}
      <div className="beginner-warning">
        <div className="warning-icon">⚠️</div>
        <div>
          <div className="warning-title">Beginner Warning</div>
          <div className="warning-text">{data.beginnerWarning}</div>
        </div>
      </div>
    </div>
  );
}
