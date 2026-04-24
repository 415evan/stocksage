// content.js — Injected into TradingView pages
// Adds StockSage AI panel with predictions, entry/exit, and chatbot

const STOCKSAGE_URL = "https://vercel.com/new/evwu12-1804s-projects/success?developer-id=&external-id=&redirect-url=&branch=main&deploymentUrl=stocksage-c7sbc9xps-evwu12-1804s-projects.vercel.app&projectName=stocksage&s=https%3A%2F%2Fgithub.com%2F415evan%2Fstocksage&gitOrgLimit=&hasTrialAvailable=1&totalProjects=1&flow-id=ZpIdCKtJkRiMwkyIMBwDS";

// ── Detect current symbol from TradingView URL/page ──
function getCurrentSymbol() {
  // Try URL first
  const urlMatch = window.location.pathname.match(/\/chart\/?.*?\/([A-Z0-9^=.%-]+)(?:\/|$)/i);
  if (urlMatch) return urlMatch[1];

  // Try page title
  const titleMatch = document.title.match(/^([A-Z0-9^=.%-]+)\s*[—–-]/);
  if (titleMatch) return titleMatch[1];

  // Try TradingView symbol display
  const symbolEl = document.querySelector('[data-symbol]') ||
    document.querySelector('.chart-container-border');
  if (symbolEl) return symbolEl.getAttribute('data-symbol') || null;

  return null;
}

// ── Map TradingView symbols back to Yahoo Finance ──
function toYahooSymbol(tvSym) {
  if (!tvSym) return null;
  const map = {
    "CME_MINI:ES1!": "ES=F", "CME_MINI:NQ1!": "NQ=F", "CBOT_MINI:YM1!": "YM=F",
    "NYMEX:CL1!": "CL=F", "COMEX:GC1!": "GC=F", "COMEX:SI1!": "SI=F",
    "SP:SPX": "^GSPC", "NASDAQ:COMP": "^IXIC", "DJ:DJI": "^DJI",
    "CBOE:VIX": "^VIX", "FX:EURUSD": "EURUSD=X", "FX:GBPUSD": "GBPUSD=X",
    "FX:USDJPY": "USDJPY=X", "BINANCE:BTCUSDT": "BTC-USD", "BINANCE:ETHUSDT": "ETH-USD",
    "BINANCE:SOLUSDT": "SOL-USD", "TVC:DXY": "DX-Y.NYB",
  };
  return map[tvSym] || tvSym;
}

// ── Create and inject the StockSage panel ──
function createPanel() {
  // Don't create if already exists
  if (document.getElementById("stocksage-panel")) return;

  const panel = document.createElement("div");
  panel.id = "stocksage-panel";
  panel.innerHTML = `
    <div id="ss-header">
      <div id="ss-logo">◈ StockSage AI</div>
      <div id="ss-controls">
        <button id="ss-minimize">—</button>
        <button id="ss-close">✕</button>
      </div>
    </div>
    <div id="ss-body">
      <div id="ss-symbol-row">
        <span id="ss-current-symbol">Detecting symbol...</span>
        <button id="ss-analyze-btn">Analyze ▶</button>
      </div>
      <div id="ss-content">
        <div id="ss-welcome">
          <p>Click <strong>Analyze</strong> to get AI predictions for the current chart.</p>
          <div id="ss-quick-links">
            <a href="${STOCKSAGE_URL}" target="_blank" class="ss-link">Open StockSage ↗</a>
            <a href="${STOCKSAGE_URL}/dashboard" target="_blank" class="ss-link">Dashboard ↗</a>
          </div>
        </div>
      </div>
      <div id="ss-chat-section">
        <div id="ss-chat-messages">
          <div class="ss-msg bot">Hi! Ask me anything about this chart 👋</div>
        </div>
        <div id="ss-chat-input-row">
          <button id="ss-voice-btn" title="Voice input">🎤</button>
          <input id="ss-chat-input" type="text" placeholder="Ask about entry, exit, patterns..." />
          <button id="ss-chat-send">→</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // State
  let minimized = false;
  let chatMessages = [{ role: "assistant", content: "Hi! Ask me anything about this chart 👋" }];
  let currentAnalysis = null;
  let isListening = false;
  let recognition = null;

  // Setup voice
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.onresult = (e) => {
      document.getElementById("ss-chat-input").value = e.results[0][0].transcript;
      isListening = false;
      document.getElementById("ss-voice-btn").textContent = "🎤";
    };
    recognition.onend = () => {
      isListening = false;
      document.getElementById("ss-voice-btn").textContent = "🎤";
    };
  }

  // Controls
  document.getElementById("ss-minimize").onclick = () => {
    minimized = !minimized;
    document.getElementById("ss-body").style.display = minimized ? "none" : "flex";
    document.getElementById("ss-minimize").textContent = minimized ? "+" : "—";
  };

  document.getElementById("ss-close").onclick = () => {
    panel.style.display = "none";
    // Show reopen button
    const btn = document.createElement("button");
    btn.id = "ss-reopen-btn";
    btn.textContent = "◈";
    btn.title = "Open StockSage AI";
    btn.onclick = () => { panel.style.display = "flex"; btn.remove(); };
    document.body.appendChild(btn);
  };

  document.getElementById("ss-voice-btn").onclick = () => {
    if (!recognition) { alert("Voice not supported in this browser"); return; }
    if (isListening) { recognition.stop(); isListening = false; document.getElementById("ss-voice-btn").textContent = "🎤"; }
    else { recognition.start(); isListening = true; document.getElementById("ss-voice-btn").textContent = "🔴"; }
  };

  // Analyze button
  document.getElementById("ss-analyze-btn").onclick = async () => {
    const rawSym = getCurrentSymbol();
    const sym = toYahooSymbol(rawSym) || rawSym;
    if (!sym) { showContent("<p style='color:#ef4444'>Could not detect symbol. Open a chart first.</p>"); return; }

    document.getElementById("ss-analyze-btn").textContent = "Analyzing...";
    document.getElementById("ss-analyze-btn").disabled = true;
    showContent('<div class="ss-loading"><div class="ss-spinner"></div><span>Analyzing ' + sym + '...</span></div>');

    try {
      const res = await fetch(`${STOCKSAGE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: sym }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      currentAnalysis = data;
      renderAnalysis(data, sym);
    } catch (err) {
      showContent(`<p style="color:#ef4444">Error: ${err.message}</p>`);
    } finally {
      document.getElementById("ss-analyze-btn").textContent = "Analyze ▶";
      document.getElementById("ss-analyze-btn").disabled = false;
    }
  };

  // Chat send
  function sendChat() {
    const input = document.getElementById("ss-chat-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addChatMessage("user", text);
    chatMessages.push({ role: "user", content: text });

    const stockCtx = currentAnalysis ? `Symbol: ${currentAnalysis.stockData?.ticker}, Price: $${currentAnalysis.stockData?.price}, Sentiment: ${currentAnalysis.analysis?.sentiment}, Entry: ${currentAnalysis.priceAction?.entryExit?.entryPrice}, Stop: ${currentAnalysis.priceAction?.entryExit?.stopLoss}` : null;

    fetch(`${STOCKSAGE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatMessages.slice(-10), stockContext: stockCtx }),
    }).then(r => r.json()).then(d => {
      const reply = d.reply || "Sorry, I couldn't connect.";
      chatMessages.push({ role: "assistant", content: reply });
      addChatMessage("bot", reply);
      // Speak reply
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
      }
    }).catch(() => addChatMessage("bot", "Connection error. Make sure you're online."));
  }

  document.getElementById("ss-chat-send").onclick = sendChat;
  document.getElementById("ss-chat-input").onkeydown = (e) => { if (e.key === "Enter") sendChat(); };

  // Detect symbol on load
  setTimeout(() => {
    const sym = getCurrentSymbol();
    if (sym) document.getElementById("ss-current-symbol").textContent = toYahooSymbol(sym) || sym;
  }, 2000);

  // Watch for symbol changes
  const observer = new MutationObserver(() => {
    const sym = getCurrentSymbol();
    if (sym) document.getElementById("ss-current-symbol").textContent = toYahooSymbol(sym) || sym;
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function showContent(html) {
  document.getElementById("ss-content").innerHTML = html;
}

function renderAnalysis(data, sym) {
  const ee = data.priceAction?.entryExit;
  const sentiment = data.analysis?.sentiment;
  const sColor = sentiment==="bullish"?"#22c55e":sentiment==="bearish"?"#ef4444":"#f59e0b";

  showContent(`
    <div class="ss-result">
      <div class="ss-sentiment" style="background:${sColor}">
        ${sentiment==="bullish"?"🐂":sentiment==="bearish"?"🐻":"😐"} ${(sentiment||"neutral").toUpperCase()}
      </div>
      <div class="ss-summary">${data.analysis?.summary || ""}</div>
      ${ee ? `
        <div class="ss-levels">
          <div class="ss-level entry"><span class="ss-level-label">▲ Enter</span><span class="ss-level-price">${ee.entryPrice}</span></div>
          <div class="ss-level stop"><span class="ss-level-label">✕ Stop</span><span class="ss-level-price">${ee.stopLoss}</span></div>
          <div class="ss-level t1"><span class="ss-level-label">★ T1</span><span class="ss-level-price">${ee.exit1}</span></div>
          <div class="ss-level t2"><span class="ss-level-label">★★ T2</span><span class="ss-level-price">${ee.exit2}</span></div>
        </div>
        <div class="ss-invalidation">🚫 Cancel if: ${ee.invalidationNote||"N/A"}</div>
      ` : ""}
      <a href="${STOCKSAGE_URL}/?ticker=${encodeURIComponent(sym)}" target="_blank" class="ss-full-link">Open full analysis on StockSage ↗</a>
    </div>
  `);
}

function addChatMessage(role, text) {
  const msgs = document.getElementById("ss-chat-messages");
  const div = document.createElement("div");
  div.className = `ss-msg ${role}`;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// ── Init ──
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createPanel);
} else {
  createPanel();
}
