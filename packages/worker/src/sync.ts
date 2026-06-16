import { createHmac, randomUUID } from "node:crypto";

export function createSignedSyncRequest(body: string, secret: string, now = Date.now()) {
  const timestamp = String(now);
  const nonce = randomUUID();
  const signature = createHmac("sha256", secret).update(`${timestamp}.${nonce}.${body}`).digest("hex");
  return {
    headers: {
      "content-type": "application/json",
      "x-sync-timestamp": timestamp,
      "x-sync-nonce": nonce,
      "x-sync-signature": signature,
    },
    body,
  };
}

export async function syncMirror(payload: unknown) {
  const url = process.env.MIRROR_SYNC_URL;
  const secret = process.env.SYNC_SECRET;
  if (!url || !secret) return { skipped: true, reason: "mirror sync not configured" };
  const request = createSignedSyncRequest(JSON.stringify(payload), secret);
  const response = await fetch(url, { method: "POST", ...request, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Mirror sync failed: ${response.status}`);
  return response.json();
}
