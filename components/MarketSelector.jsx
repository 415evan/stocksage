// components/MarketSelector.jsx
import { useState } from "react";
import { MARKETS } from "../lib/markets";

export default function MarketSelector({ onSelect, loading }) {
  const [activeCategory, setActiveCategory] = useState("futures");
  const category = MARKETS[activeCategory];

  return (
    <div className="market-selector">
      <div className="market-tabs">
        {Object.entries(MARKETS).map(([key, cat]) => (
          <button key={key} className={`market-tab ${activeCategory === key ? "active" : ""}`} onClick={() => setActiveCategory(key)}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>
      <div className="market-grid">
        {category.items.map(item => (
          <button key={item.symbol} className="market-item" onClick={() => onSelect(item.symbol)} disabled={loading}>
            <div className="market-item-symbol">{item.symbol}</div>
            <div className="market-item-name">{item.name}</div>
            <div className="market-item-desc">{item.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
