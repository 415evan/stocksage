export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, stockContext } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages required" });

  const systemPrompt = `You are StockSage AI, a friendly trading mentor. Help beginner and intermediate traders.
${stockContext ? `CURRENT MARKET: ${stockContext}` : ""}
Keep responses conversational, 2-4 sentences. No bullet points. Always mention educational purposes when giving trade suggestions.`;

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
