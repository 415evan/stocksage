// components/ChatBot.jsx
// Voice + text AI trading chatbot

import { useState, useRef, useEffect } from "react";

export default function ChatBot({ stockContext, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm StockSage AI 👋 Ask me anything about trading — entries, exits, patterns, risk management, or the current chart. I can help beginners and experienced traders alike!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Check voice support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setVoiceSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function toggleVoice() {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  // Text to speech for bot replies
  function speak(text) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          stockContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const reply = data.reply;
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const QUICK_QUESTIONS = [
    "What's a good entry point?",
    "Where should I put my stop loss?",
    "Is this a good time to buy?",
    "Explain the RSI indicator",
    "What does this pattern mean?",
    "What's the risk on this trade?",
  ];

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay">
      <div className="chatbot-panel">
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-left">
            <div className="chatbot-avatar">◈</div>
            <div>
              <div className="chatbot-title">StockSage AI</div>
              <div className="chatbot-subtitle">Trading Assistant · Voice + Text</div>
            </div>
          </div>
          <button className="chatbot-close" onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              {msg.role === "assistant" && <div className="msg-avatar">◈</div>}
              <div className="msg-bubble">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg assistant">
              <div className="msg-avatar">◈</div>
              <div className="msg-bubble typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions */}
        <div className="quick-questions">
          {QUICK_QUESTIONS.map((q, i) => (
            <button key={i} className="quick-q-btn" onClick={() => sendMessage(q)} disabled={loading}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="chatbot-input-row">
          {voiceSupported && (
            <button
              className={`voice-btn ${isListening ? "listening" : ""}`}
              onClick={toggleVoice}
              title={isListening ? "Stop listening" : "Speak your question"}
            >
              {isListening ? "🔴" : "🎤"}
            </button>
          )}
          <input
            type="text"
            className="chatbot-input"
            placeholder={isListening ? "Listening..." : "Ask anything about trading..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            disabled={loading || isListening}
          />
          <button
            className="chatbot-send"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            {loading ? <span className="spinner-sm" /> : "→"}
          </button>
        </div>

        {isListening && (
          <div className="voice-indicator">
            <div className="voice-wave"><span/><span/><span/><span/><span/></div>
            <span>Listening... speak your question</span>
          </div>
        )}
      </div>
    </div>
  );
}
