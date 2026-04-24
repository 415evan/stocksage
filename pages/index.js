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
  "Running AI analysis...",
];

export default function Home() {
  const { data: session } = useSession();
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [streamingText, setStreamingText] = useState("");
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
    setLoading(true);
    setError(null);
    setResult(null);
    setStreamingText("");
    setTicker(symbol);
    setLoadingStep(0);
    setShowMarkets(false);

    const si = setInterval(() => setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 900);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: symbol }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let partialResult = {};
      let buffer = "";

      clearInterval(si);
      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === "[DONE]") continue;
          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);

            if (parsed.type === "stockData") {
              partialResult = { ...partialResult, stockData: parsed.stockData, news: parsed.news, priceAction: parsed.priceAction };
              setResult({ ...partialResult });
              setActiveTab("chart");
            } else if (parsed.type === "delta") {
              setStreamingText(prev => prev + parsed.text);
            } else if (parsed.type === "complete") {
              partialResult = { ...partialResult, analysis: parsed.analysis, priceAction: parsed.priceAction };
              setResult({ ...partialResult });
              setStreamingText("");
            } else if (parsed.type === "error") {
              setError(parsed.error);
            }
          } catch (e) {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      clearInterval(si);
      setError(err.message);
      setShowMarkets(true);
    } finally {
      clearInterval(si);
      setLoading(false);
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

  const stockContext = result?.stockData
    ? `Symbol: ${result.stockData.ticker} Price: $${result.stockData.price} (${result.stockData.change}/${result.stockData.changePercent}) RSI: ${result.stockData.rsi} MA20: ${result.stockData.ma20 || "N/A"} Support: $${result.stockData.support} Resistance: $${result.stockData.resistance} Sentiment: ${result.analysis?.sentiment || "analyzing..."}`
    : null;

  return (
    <>
      <Head>
        <title>StockSage Pro — AI Trading Analysis</title>
        <meta name="description" content="Live prices, AI price action, entry & exit points, voice chatbot" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap" rel="stylesheet" />
      </Head>

      <main className="main">
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

        <section className="search-section">
          <div className="search-box">
            <input type="text" className="search-input"
              placeholder="Type any ticker (BTC-USD, ES=F, AAPL) or pick below"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleAnalyze()}
              maxLength={20} />
            <button className="search-btn" onClick={() => handleAnalyze()} disabled={loading || !ticker.trim()}>
              {loading ? <span className="spinner" /> : "Analyze →"}
            </button>
          </div>
          <div className="search-actions">
            <button className="toggle-markets-btn" onClick={() => setShowMarkets(v => !v)}>
              {showMarkets ? "▲ Hide Markets" : "▼ Browse Markets"}
            </button>
            {result && <button className="new-search-btn" onClick={() => { setResult(null); setShowMarkets(true); setTicker(""); setStreamingText(""); }}>← New Search</button>}
            {result && <button className={`watchlist-btn ${isWatched ? "watched" : ""}`} onClick={() => toggleWatchlist(currentTicker)}>{isWatched ? "★ Watching" : "☆ Watchlist"}</button>}
          </div>
        </section>

        {showMarkets && !loading && !result && <MarketSelector onSelect={handleAnalyze} loading={loading} />}

        {error && (
          <div className="error-box">
            <span className="error-icon">⚠</span>
            <div><strong>Error:</strong> {error}</div>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="loading-orb" />
            <div className="loading-text">{LOADING_STEPS[loadingStep]}</div>
            <div className="loading-progress">
              {LOADING_STEPS.map((_, i) => <div key={i} className={`progress-dot ${i <= loadingStep ? "active" : ""}`} />)}
            </div>
            <div className="loading-sub">Analyzing {ticker}...</div>
          </div>
        )}

        {result?.stockData && !loading && (
          <div className="results">
            <StockCard data={result.stockData} assetInfo={assetInfo} />

            <div className="tab-bar">
              {[
                ["chart", "📈 Chart"],
                ["priceaction", "🔍 Price Action"],
                ["trade", "⚡ Trade Setup"],
                ["analysis", "🤖 AI Analysis"],
                ["news", `📰 News${result.news?.length ? ` (${result.news.length})` : ""}`],
              ].map(([id, label]) => (
                <button key={id} className={`tab-btn ${activeTab === id ? "active" : ""}`} onClick={() => setActiveTab(id)}>{label}</button>
              ))}
            </div>

            <div className="tab-content">
              {activeTab === "chart" && <TradingViewChart ticker={result.stockData.ticker} priceAction={result.priceAction} />}
              {activeTab === "priceaction" && <PriceAction data={result.priceAction} />}
              {activeTab === "trade" && result.analysis?.tradeSetup && <TradeSetup setup={result.analysis.tradeSetup} sentiment={result.analysis.sentiment} />}
              {activeTab === "analysis" && (
                result.analysis
                  ? <Analysis data={result.analysis} />
                  : streamingText
                    ? <div className="streaming-box">
                        <div className="streaming-label">✦ AI is analyzing...</div>
                        <div className="streaming-text">{streamingText}<span className="cursor">▋</span></div>
                      </div>
                    : <div className="loading-state" style={{ padding: "40px 0" }}><div className="loading-orb" /><div className="loading-text">Generating AI analysis...</div></div>
              )}
              {activeTab === "news" && <NewsFeed news={result.news} ticker={result.stockData?.ticker} />}
            </div>
          </div>
        )}

        <footer className="footer">
          <p>📚 <strong>Educational purposes only.</strong> Not financial advice. Data is 15-min delayed.</p>
        </footer>
      </main>

      <button className="chat-fab" onClick={() => setChatOpen(true)} title="Ask AI Trading Assistant">
        <span className="chat-fab-icon">💬</span>
        <span className="chat-fab-label">Ask AI</span>
      </button>

      <ChatBot stockContext={stockContext} isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
