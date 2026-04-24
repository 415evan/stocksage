// components/Analysis.jsx
export default function Analysis({ data }) {
  const color = data.sentiment === "bullish" ? "#22c55e" : data.sentiment === "bearish" ? "#ef4444" : "#f59e0b";
  const emoji = data.sentiment === "bullish" ? "🐂" : data.sentiment === "bearish" ? "🐻" : "😐";
  const pred = data.prediction;

  const upProb = pred?.upProbability ? parseInt(pred.upProbability) : null;
  const downProb = upProb ? 100 - upProb : null;

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <span className="ai-badge">✦ AI Analysis</span>
        <span className="sentiment-tag" style={{ background: color }}>{emoji} {data.sentiment?.toUpperCase()}</span>
      </div>

      <Section icon="📰" title="What's Happening" color="#6366f1" text={data.summary} />

      {/* Price Prediction Block */}
      {pred && (
        <div className="prediction-block">
          <div className="prediction-header">
            <span className="prediction-title">🔮 Price Predictions</span>
            <span className={`confidence-badge ${pred.confidence}`}>{pred.confidence?.toUpperCase()} CONFIDENCE</span>
          </div>

          {/* Up/Down probability bar */}
          {upProb && (
            <div className="prob-bar-wrapper">
              <div className="prob-labels">
                <span className="prob-up">↑ Up {upProb}%</span>
                <span className="prob-down">↓ Down {downProb}%</span>
              </div>
              <div className="prob-bar">
                <div className="prob-bar-fill" style={{ width: `${upProb}%`, background: upProb >= 50 ? "#22c55e" : "#ef4444" }} />
              </div>
            </div>
          )}

          <div className="prediction-grid">
            <PredBox icon="📅" label="1-3 Days" value={pred.shortTerm} color="#818cf8" />
            <PredBox icon="📆" label="1-2 Weeks" value={pred.mediumTerm} color="#a78bfa" />
            <PredBox icon="🎯" label="Bull Target" value={pred.bullishTarget} color="#22c55e" />
            <PredBox icon="⚠️" label="Bear Target" value={pred.bearishTarget} color="#ef4444" />
          </div>

          {pred.keyLevelToWatch && (
            <div className="key-level-box">
              <span className="key-level-icon">🔑</span>
              <div>
                <div className="key-level-title">Key Level to Watch</div>
                <div className="key-level-text">{pred.keyLevelToWatch}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <Section icon="📊" title="Technical Read" color="#818cf8" text={data.technicalRead} />
      <Section icon="🗞️" title="News Impact" color="#a78bfa" text={data.newsImpact} />
      <Section icon="🐂" title="Bullish Scenario" color="#22c55e" text={data.bullish} />
      <Section icon="🐻" title="Bearish Scenario" color="#ef4444" text={data.bearish} />
      <Section icon="🚫" title="No-Trade Zone" color="#f59e0b" text={data.noTradeZone} />

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

function Section({ icon, title, color, text }) {
  return (
    <div className="analysis-section" style={{ borderLeftColor: color }}>
      <div className="section-title" style={{ color }}>{icon} {title}</div>
      <p className="section-text">{text}</p>
    </div>
  );
}

function PredBox({ icon, label, value, color }) {
  return (
    <div className="pred-box" style={{ borderTopColor: color }}>
      <div className="pred-box-label">{icon} {label}</div>
      <div className="pred-box-value" style={{ color }}>{value}</div>
    </div>
  );
}
