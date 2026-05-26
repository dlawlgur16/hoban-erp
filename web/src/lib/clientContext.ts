import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "current_client";
const DEFAULT_CODE = "SAMSUNG";

export interface ClientContext {
  id: number;
  name: string;
  code: string;
}

/** 현재 선택된 클라이언트 정보. 쿠키 없으면 첫 활성 클라이언트로. */
export async function getCurrentClient(): Promise<ClientContext> {
  const c = await cookies();
  const code = c.get(COOKIE_NAME)?.value || DEFAULT_CODE;
  let client = await prisma.client.findUnique({ where: { code } });
  if (!client) {
    client = await prisma.client.findFirst({
      where: { active: true },
      orderBy: { id: "asc" },
    });
  }
  if (!client) throw new Error("등록된 클라이언트가 없습니다.");
  return { id: client.id, name: client.name, code: client.code };
}

/** 모든 활성 클라이언트 (스위처 표시용) */
export async function getAllClients(): Promise<ReadonlyArray<ClientContext>> {
  const list = await prisma.client.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
  });
  return list.map((c) => ({ id: c.id, name: c.name, code: c.code }));
}
