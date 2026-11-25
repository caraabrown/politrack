module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY in Vercel environment variables." });
  }

  try {
    const incoming = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { model, max_tokens, messages, useSearch } = incoming;

    const payload = {
      model: model || "claude-sonnet-4-20250514",
      max_tokens: max_tokens || 8000,
      messages,
    };

    if (useSearch) {
      payload.tools = [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 5,
        },
      ];
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || `Anthropic API error (${response.status})`,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal proxy error" });
  }
};
