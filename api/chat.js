export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "API key not configured",
      debug: `ENV keys available: ${Object.keys(process.env).filter(k => k.includes('ANTHROP')).join(', ')}`
    });
  }

  try {
    const body = req.body;
    
    // Remove any fields Anthropic doesn't accept
    const cleanBody = {
      model: body.model || "claude-sonnet-4-20250514",
      max_tokens: body.max_tokens || 1000,
      system: body.system,
      messages: body.messages,
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(cleanBody),
    });

    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Invalid JSON from Anthropic", raw: text.slice(0, 200) });
    }

    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message, stack: error.stack?.slice(0, 200) });
  }
}
