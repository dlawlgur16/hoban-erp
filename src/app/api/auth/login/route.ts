import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword, createSessionToken, SESSION_CONFIG } from "@/lib/auth";

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!verifyPassword(parsed.data.password)) {
    return NextResponse.json(
      { success: false, error: "비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_CONFIG.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_CONFIG.maxAge,
    path: "/",
  });
  return res;
}
