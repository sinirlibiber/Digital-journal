// ============================================================
// config.js — Edit this file to enable real API integrations
// ============================================================
// 1. SHELBY API KEY  → https://geomi.dev  (select Testnet, Client key)
// 2. NOUS API KEY    → https://portal.nousresearch.com  ($5 free credit)
// 3. Testnet APT     → https://aptos.dev/network/faucet
// 4. ShelbyUSD       → https://discord.gg/shelbyprotocol → #faucet
//
// Leave keys as "" to use mock/demo mode (works without any setup).
// ============================================================

export const CONFIG = {
  SHELBY_API_KEY: "AG-NVJ4BP52W5NGWRTOH6NS2NK6GYMURFWYZ",

  NOUS_API_KEY: "",
  NOUS_BASE_URL: "https://inference-api.nousresearch.com/v1",
  NOUS_MODEL: "hermes-3-llama-3.1-70b",

  NOUS_DEMO_RESPONSES: [
    "✨ You seem to be in a joyful, energetic mood today! Something positive is clearly happening in your life.",
    "🌧️ It looks like you had a stressful day. Remember — tough moments pass, and you are stronger than you think.",
    "🤔 There's a lot on your mind. Taking time to write it all down is already a big step forward.",
    "💛 A calm, reflective energy comes through your words. You seem at peace with yourself today.",
    "🔥 You're feeling motivated and ready to take on the world! Ride that wave.",
    "😔 A hint of sadness or loneliness in your words. It's okay — sometimes we just need to feel things fully.",
    "🌱 This entry feels like growth. You're processing something important and making sense of it.",
    "😂 Your mood today is light and playful — that's wonderful! Laughter is the best medicine.",
    "🧩 You seem to be in problem-solving mode. Your analytical mind is working overtime today.",
    "🌸 There's a gentle warmth in your words — gratitude, perhaps, or quiet contentment.",
  ],
};
