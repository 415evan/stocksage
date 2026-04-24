// pages/api/chat.js
// Voice + text trading chatbot

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { messages, stockContext } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages required" });

  const systemPrompt = `You are StockSage AI, a friendly trading mentor built into StockSage Pro. You help beginner and intermediate traders.

${stockContext ? `CURRENT MARKET CONTEXT:\n${stockContext}\n` : "No specific stock loaded yet."}

Guidelines:
- Answer questions about entries, exits, patterns, indicators, risk management
- Use plain English — no jargon without explanation
- Reference current stock data when relevant  
- Give specific price levels when asked
- Be encouraging and patient with beginners
- Keep responses conversational — 2-4 sentences max unless a complex question
- Never use bullet points in chat responses
- Always mention this is educational, not financial advice when giving trade suggestions`;

  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: systemPrompt,
        messages: messages.slice(-12),
      }),
    });
    if (!claudeRes.ok) {
      const err = await claudeRes.json();
      throw new Error(err?.error?.message || "Claude API error");
    }
    const data = await claudeRes.json();
    return res.status(200).json({ reply: data.content[0].text.trim() });
  } catch (err) {
    console.error("Chat error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
