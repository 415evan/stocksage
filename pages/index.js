// pages/index.js
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import StockCard from "../components/StockCard";
import TradeSetup from "../components/TradeSetup";
import Analysis from "../components/Analysis";
import NewsFeed from "../components/NewsFeed";
import PriceAction from "../components/PriceAction";
import MarketSelector from "../components/MarketSelector";
import ChatBot from "../components/ChatBot";
import { SYMBOL_MAP } from "../lib/markets";

const TradingViewChart = dynamic(() => import("../components/TradingViewChart"), { ssr: false });

const LOADING_STEPS = [
  "Fetching market data...",
  "Loading candlestick history...",
  "Detecting price action patterns...",
  "Analyzing market structure...",
  "Calculating entry & exit points...",
  "Running AI analysis...",
];

export default function Home() {
  const { data: session } = useSession();
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("chart");
  const [showMarkets, setShowMarkets] = useState(true);
  const [watchlist, setWatchlist] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (session) {
      fetch("/api/watchlist").then(r => r.json()).then(d => setWatchlist(d.symbols || [])).catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("ticker");
    if (t) handleAnalyze(t.toUpperCase());
  }, []);

  async function handleAnalyze(tickerToUse) {
    const symbol = (tickerToUse || ticker).trim().toUpperCase();
    if (!symbol) return;
    setLoading(true); setError(null); setResult(null);
    setTicker(symbol); setLoadingStep(0); setShowMarkets(false);
    const si = setInterval(() => setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 700);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: symbol }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResult(data); setActiveTab("chart");
    } catch (err) {
      setError(err.message); setShowMarkets(true);
    } finally {
      clearInterval(si); setLoading(false);
    }
  }

  async function toggleWatchlist(sym) {
    if (!session) { signIn("google"); return; }
    const newList = watchlist.includes(sym) ? watchlist.filter(s => s !== sym) : [...watchlist, sym];
    setWatchlist(newList);
    await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbols: newList }) });
  }

  const assetInfo = result?.stockData ? SYMBOL_MAP[result.stockData.ticker] || null : null;
  const currentTicker = result?.stockData?.ticker || ticker;
  const isWatched = watchlist.includes(currentTicker);

  // Build stock context for chatbot
  const stockContext = result?.stockData ? `Symbol: ${result.stockData.ticker} (${result.stockData.companyName})
Price: $${result.stockData.price} (${result.stockData.change} / ${result.stockData.changePercent})
RSI: ${result.stockData.rsi} | MACD hist: ${result.stockData.macd?.hist || "N/A"}
MA20: ${result.stockData.ma20 || "N/A"} | MA50: ${result.stockData.ma50 || "N/A"}
Support: $${result.stockData.support} | Resistance: $${result.stockData.resistance}
AI Sentiment: ${result.analysis?.sentiment || "N/A"}
Entry: ${result.priceAction?.entryExit?.entryPrice || "N/A"} | Stop: ${result.priceAction?.entryExit?.stopLoss || "N/A"} | T1: ${result.priceAction?.entryExit?.exit1 || "N/A"}` : null;

  return (
    <>
      <Head>
        <title>StockSage Pro — AI Trading Analysis</title>
        <meta name="description" content="AI price action, entry & exit points, voice chatbot" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap" rel="stylesheet" />
      </Head>

      <main className="main">
        {/* Nav */}
        <nav className="top-nav">
          <div className="nav-logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">StockSage <span className="pro-tag">PRO</span></span>
          </div>
          <div className="nav-links">
            <Link href="/dashboard" className="nav-link">📊 Dashboard</Link>
            <Link href="/newsletter" className="nav-link">📰 Newsletter</Link>
            <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" className="nav-link tv-link">📈 TradingView ↗</a>
            {session ? (
              <div className="nav-user">
                <span className="nav-username">👤 {session.user?.name?.split(" ")[0]}</span>
                <button className="nav-signout" onClick={() => signOut()}>Sign out</button>
              </div>
            ) : (
              <button className="nav-signin" onClick={() => signIn("google")}>Sign in with Google</button>
            )}
          </div>
        </nav>

        <header className="header">
          <p className="tagline">Futures · Forex · Crypto · Indices · Stocks — AI price action, entry & exit, voice chatbot</p>
        </header>

        {/* Search */}
        <section className="search-section">
          <div className="search-box">
            <input type="text" className="search-input" placeholder="Type any ticker (BTC-USD, ES=F, AAPL) or pick below"
              value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleAnalyze()} maxLength={20} />
            <button className="search-btn" onClick={() => handleAnalyze()} disabled={loading || !ticker.trim()}>
              {loading ? <span className="spinner" /> : "Analyze →"}
            </button>
          </div>
          <div className="search-actions">
            <button className="toggle-markets-btn" onClick={() => setShowMarkets(v => !v)}>
              {showMarkets ? "▲ Hide Markets" : "▼ Browse Markets"}
            </button>
            {result && <button className="new-search-btn" onClick={() => { setResult(null); setShowMarkets(true); setTicker(""); }}>← New Search</button>}
            {result && <button className={`watchlist-btn ${isWatched ? "watched" : ""}`} onClick={() => toggleWatchlist(currentTicker)}>{isWatched ? "★ Watching" : "☆ Watchlist"}</button>}
          </div>
        </section>

        {showMarkets && !loading && <MarketSelector onSelect={handleAnalyze} loading={loading} />}

        {error && <div className="error-box"><span className="error-icon">⚠</span><div><strong>Error:</strong> {error}</div></div>}

        {loading && (
          <div className="loading-state">
            <div className="loading-orb" />
            <div className="loading-text">{LOADING_STEPS[loadingStep]}</div>
            <div className="loading-progress">{LOADING_STEPS.map((_, i) => <div key={i} className={`progress-dot ${i <= loadingStep ? "active" : ""}`} />)}</div>
            <div className="loading-sub">Analyzing {ticker}... 5–15 seconds</div>
          </div>
        )}

        {result && !loading && (
          <div className="results">
            {result.stockData && <StockCard data={result.stockData} assetInfo={assetInfo} />}
            <div className="tab-bar">
              {[["chart","📈 Chart"],["priceaction","🔍 Price Action"],["trade","⚡ Trade Setup"],["analysis","🤖 AI Analysis"],["news",`📰 News${result.news?.length?` (${result.news.length})`:""}`]].map(([id,label]) => (
                <button key={id} className={`tab-btn ${activeTab===id?"active":""}`} onClick={() => setActiveTab(id)}>{label}</button>
              ))}
            </div>
            <div className="tab-content">
              {activeTab === "chart" && <TradingViewChart ticker={result.stockData.ticker} priceAction={result.priceAction} />}
              {activeTab === "priceaction" && <PriceAction data={result.priceAction} />}
              {activeTab === "trade" && result.analysis?.tradeSetup && <TradeSetup setup={result.analysis.tradeSetup} sentiment={result.analysis.sentiment} />}
              {activeTab === "analysis" && result.analysis && <Analysis data={result.analysis} />}
              {activeTab === "news" && <NewsFeed news={result.news} ticker={result.stockData?.ticker} />}
            </div>
          </div>
        )}

        <footer className="footer">
          <p>📚 <strong>Educational purposes only.</strong> Not financial advice. Data is 15-min delayed.</p>
        </footer>
      </main>

      {/* Floating Chat Button */}
      <button className="chat-fab" onClick={() => setChatOpen(true)} title="Ask AI Trading Assistant">
        <span className="chat-fab-icon">💬</span>
        <span className="chat-fab-label">Ask AI</span>
      </button>

      {/* ChatBot Panel */}
      <ChatBot stockContext={stockContext} isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
