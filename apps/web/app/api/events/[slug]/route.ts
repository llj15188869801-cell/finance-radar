import { NextResponse } from "next/server";
import { getLiveEvent } from "../../../../lib/live-data";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const event = await getLiveEvent((await params).slug);
  return event ? NextResponse.json({ data: event }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}
