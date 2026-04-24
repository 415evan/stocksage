// components/NewsFeed.jsx
function timeAgo(iso) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff/60000), h = Math.floor(m/60), d = Math.floor(h/24);
    return d>0?`${d}d ago`:h>0?`${h}h ago`:m>0?`${m}m ago`:"Just now";
  } catch { return ""; }
}

export default function NewsFeed({ news, ticker }) {
  return (
    <div className="news-card">
      <div className="news-header">
        <span className="news-title">📰 Latest News</span>
        <span className="news-ticker">{ticker}</span>
        {news?.length > 0 && <span className="news-count">{news.length} articles</span>}
      </div>
      {!news?.length ? <p className="news-empty">No recent news found.</p> : (
        <div className="news-list">
          {news.map((item, i) => (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="news-item">
              <div className="news-item-content">
                <div className="news-item-title">{item.title}</div>
                <div className="news-item-meta">
                  <span className="news-source">{item.source}</span>
                  <span className="news-dot">·</span>
                  <span className="news-time">{timeAgo(item.publishedAt)}</span>
                </div>
              </div>
              <span className="news-arrow">→</span>
            </a>
          ))}
        </div>
      )}
      <p className="news-disclaimer">⏱ News may be delayed. Verify before trading.</p>
    </div>
  );
}
