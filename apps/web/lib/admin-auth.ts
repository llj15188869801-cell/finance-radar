import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "finance_radar_admin";

function signature(secret: string) {
  return createHmac("sha256", secret).update("finance-radar-admin-v1").digest("hex");
}

export async function isAdminAuthenticated() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  const expected = signature(secret);
  return token.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function createAdminToken() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return signature(secret);
}
