export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_KEY;
    res.status(200).json({
      status: "ok",
      hasKey: !!apiKey,
      keyPrefix: apiKey ? apiKey.substring(0, 12) + "..." : "MISSING"
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "API key not configured" });
    return;
  }

  try {
    const body = req.body || {};
    const payload = {
      model: body.model || "claude-sonnet-4-20250514",
      max_tokens: Number(body.max_tokens) || 1000,
      messages: body.messages || [],
    };
    if (body.system) payload.system = body.system;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await anthropicRes.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      res.status(500).json({ error: "Invalid JSON from Anthropic", raw: responseText.slice(0, 200) });
      return;
    }

    res.status(anthropicRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
