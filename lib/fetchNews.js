// lib/fetchNews.js
export async function fetchNews(ticker) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${ticker}&newsCount=8&quotesCount=0`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const data = await res.json();
    return (data.news || []).slice(0, 8).map(item => ({
      title: item.title || "No title",
      source: item.publisher || "Yahoo Finance",
      url: item.link || "#",
      publishedAt: item.providerPublishTime
        ? new Date(item.providerPublishTime * 1000).toISOString()
        : new Date().toISOString(),
    }));
  } catch { return []; }
}
