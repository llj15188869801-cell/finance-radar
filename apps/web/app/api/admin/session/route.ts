import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminToken } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !process.env.ADMIN_SESSION_SECRET) return NextResponse.json({ error: "ADMIN_NOT_CONFIGURED" }, { status: 503 });
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const valid = password.length === expected.length && timingSafeEqual(Buffer.from(password), Buffer.from(expected));
  if (!valid) return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, createAdminToken(), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60, path: "/" });
  return response;
}
