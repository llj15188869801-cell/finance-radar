import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../lib/admin-auth";
import { getAdminSnapshot } from "../../../../lib/event-store";

export async function GET() {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json(await getAdminSnapshot());
}
