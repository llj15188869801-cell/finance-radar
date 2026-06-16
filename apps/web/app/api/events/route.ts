import { NextResponse } from "next/server";
import { getLiveEvents } from "../../../lib/live-data";

export async function GET() {
  const events = await getLiveEvents();
  return NextResponse.json({ data: events, meta: { count: events.length, generatedAt: new Date().toISOString() } });
}
