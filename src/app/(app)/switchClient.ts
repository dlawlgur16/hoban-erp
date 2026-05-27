"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE_NAME = "current_client";

export async function switchClient(code: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, code, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  // 모든 (app) 페이지 재렌더링
  revalidatePath("/", "layout");
}
