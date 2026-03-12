import { CONFIG } from "./config";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHELBY_BASE = "https://api.shelbynet.shelby.xyz/shelby";

export const isShelbyMock = () => !CONFIG.SHELBY_API_KEY;

/**
 * Upload journal entry to Shelby Protocol
 * Real endpoint: PUT /v1/blobs/{account}/{blobName}
 * Session endpoint: POST /v1/sessions (to get auth token from API key)
 */
export async function uploadToShelby(text, address, signAndSubmitTransaction) {
  const blobName = `journal_${Date.now()}.txt`;

  // ── Mock mode (no API key) ──
  if (isShelbyMock()) {
    await sleep(800);
    return { blobName, mock: true };
  }

  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);

    // Step 1: Create a session using the API key
    const sessionRes = await fetch(`${SHELBY_BASE}/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CONFIG.SHELBY_API_KEY}`,
      },
      body: JSON.stringify({ account: address }),
    });

    let authHeader = `Bearer ${CONFIG.SHELBY_API_KEY}`;
    if (sessionRes.ok) {
      const session = await sessionRes.json();
      if (session.token) authHeader = `Bearer ${session.token}`;
    }

    // Step 2: Upload blob via PUT
    const uploadRes = await fetch(
      `${SHELBY_BASE}/v1/blobs/${encodeURIComponent(address)}/${blobName}`,
      {
        method: "PUT",
        headers: {
          "Content-Length": String(bytes.length),
          "Authorization": authHeader,
        },
        body: bytes,
      }
    );

    if (uploadRes.status === 204 || uploadRes.ok) {
      return { blobName, mock: false };
    }

    console.warn(`Shelby upload returned ${uploadRes.status}, falling back to mock`);
    return { blobName, mock: true };

  } catch (err) {
    console.warn("Shelby error, falling back to mock:", err);
    return { blobName, mock: true };
  }
}
