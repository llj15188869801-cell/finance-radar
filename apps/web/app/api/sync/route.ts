import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { persistSyncedEvents } from "../../../lib/event-store";
import { prisma } from "../../../lib/db";

export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return NextResponse.json({ error: "SYNC_NOT_CONFIGURED" }, { status: 503 });
  const timestamp = request.headers.get("x-sync-timestamp") ?? "";
  const nonce = request.headers.get("x-sync-nonce") ?? "";
  const signature = request.headers.get("x-sync-signature") ?? "";
  const body = await request.text();
  const age = Math.abs(Date.now() - Number(timestamp));
  if (!timestamp || !nonce || age > 5 * 60_000) return NextResponse.json({ error: "STALE_OR_REPLAYED" }, { status: 401 });
  const expected = createHmac("sha256", secret).update(`${timestamp}.${nonce}.${body}`).digest("hex");
  const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  await prisma.syncNonce.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  try {
    await prisma.syncNonce.create({ data: { nonce, expiresAt: new Date(Date.now() + 5 * 60_000) } });
  } catch {
    return NextResponse.json({ error: "STALE_OR_REPLAYED" }, { status: 401 });
  }
  let persistence: { persisted: number };
  try {
    persistence = await persistSyncedEvents(JSON.parse(body));
  } catch {
    return NextResponse.json({ error: "INVALID_SYNC_PAYLOAD" }, { status: 400 });
  }
  return NextResponse.json({ success: true, ...persistence, acceptedAt: new Date().toISOString() });
}
