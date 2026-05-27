import { NextResponse } from "next/server";
import { SESSION_CONFIG } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_CONFIG.cookieName, "", { maxAge: 0, path: "/" });
  return res;
}
