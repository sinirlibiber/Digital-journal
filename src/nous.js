import { CONFIG } from "./config";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function analyseWithNous(text) {
  if (!CONFIG.NOUS_API_KEY) {
    await sleep(1400 + Math.random() * 800);
    const pool = CONFIG.NOUS_DEMO_RESPONSES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const res = await fetch(`${CONFIG.NOUS_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.NOUS_API_KEY}`,
    },
    body: JSON.stringify({
      model: CONFIG.NOUS_MODEL,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content:
            "You are a compassionate emotional intelligence assistant. The user shares a personal journal entry. Respond with 1-2 sentences of warm, empathetic emotional analysis. Start with a relevant emoji. Be concise and kind. Do NOT give advice unless asked.",
        },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Nous API error (${res.status})`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "💭 Could not analyse this entry right now.";
}
