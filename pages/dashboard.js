// pages/dashboard.js
import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();
  const [prices, setPrices] = useState({});
  const [categories, setCategories] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/live-prices");
      const data = await res.json();
      if (data.prices) { setPrices(data.prices); setCategories(data.categories); setLastUpdate(new Date()); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPrices(); const i = setInterval(fetchPrices, 30000); return () => clearInterval(i); }, [fetchPrices]);
  useEffect(() => { if (session) fetch("/api/watchlist").then(r=>r.json()).then(d=>setWatchlist(d.symbols||[])).catch(()=>{}); }, [session]);

  async function toggleWatchlist(sym) {
    if (!session) { signIn("google"); return; }
    const newList = watchlist.includes(sym) ? watchlist.filter(s=>s!==sym) : [...watchlist,sym];
    setWatchlist(newList);
    await fetch("/api/watchlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbols:newList})});
  }

  const catLabels = { futures:"📊 Futures", indices:"📈 Indices", crypto:"₿ Crypto", forex:"💱 Forex" };

  return (
    <>
      <Head>
        <title>Pro Dashboard — StockSage</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <main className="main">
        <div className="dash-nav">
          <Link href="/" className="back-link">← StockSage</Link>
          <div className="dash-nav-right">
            {lastUpdate && <span className="last-update">🔄 {lastUpdate.toLocaleTimeString()} · auto-refresh 30s</span>}
            {session ? <span className="dash-user">👤 {session.user?.name?.split(" ")[0]}</span> : <button className="sign-in-btn" onClick={()=>signIn("google")}>Sign in to save watchlist</button>}
          </div>
        </div>
        <div className="dash-header">
          <h1 className="dash-title">◈ Pro Dashboard</h1>
          <p className="dash-subtitle">Live prices · Click any symbol to analyze · ★ to watchlist</p>
        </div>
        {loading && <div className="loading-state"><div className="loading-orb"/><div className="loading-text">Loading live prices...</div></div>}
        {session && watchlist.length > 0 && (
          <div className="dash-section">
            <div className="dash-section-label">⭐ Your Watchlist</div>
            <div className="dash-grid">{watchlist.map(sym=>prices[sym]&&<PriceCard key={sym} symbol={sym} data={prices[sym]} isWatched={true} onWatch={()=>toggleWatchlist(sym)}/>)}</div>
          </div>
        )}
        {!loading && Object.entries(categories).map(([cat,syms]) => (
          <div key={cat} className="dash-section">
            <div className="dash-section-label">{catLabels[cat]||cat}</div>
            <div className="dash-grid">{syms.map(sym=>prices[sym]&&<PriceCard key={sym} symbol={sym} data={prices[sym]} isWatched={watchlist.includes(sym)} onWatch={()=>toggleWatchlist(sym)}/>)}</div>
          </div>
        ))}
        <p className="footer-note">Data 15-min delayed · Educational purposes only</p>
      </main>
    </>
  );
}

function PriceCard({ symbol, data, isWatched, onWatch }) {
  return (
    <div className="price-card">
      <div className="price-card-top">
        <div className="price-card-left">
          <Link href={`/?ticker=${encodeURIComponent(symbol)}`} className="price-card-symbol">{symbol}</Link>
          <div className="price-card-name">{data.name?.slice(0,22)}</div>
        </div>
        <button className={`watch-btn ${isWatched?"watched":""}`} onClick={onWatch}>{isWatched?"★":"☆"}</button>
      </div>
      <div className="price-card-price">${data.price}</div>
      <div className={`price-card-change ${data.isUp?"up":"down"}`}>{data.isUp?"▲":"▼"} {data.change} ({data.changePct}%)</div>
      <Link href={`/?ticker=${encodeURIComponent(symbol)}`} className="analyze-link">Analyze →</Link>
    </div>
  );
}
