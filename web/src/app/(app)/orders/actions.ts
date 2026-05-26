"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const lineSchema = z.object({
  siteId: z.number().int().positive(),
  itemId: z.number().int().positive(),
  qtyUnits: z.number().int().nonnegative().default(0),
  qtyBoxes: z.number().int().nonnegative().default(0),
});

const createSchema = z.object({
  clientId: z.number().int().positive(),
  roundNo: z.number().int().positive(),
  roundLabel: z.string().min(1).max(50),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxInvoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  memo: z.string().max(2000).nullable().optional(),
  lines: z.array(lineSchema).min(1),
});

export type CreateOrderInput = z.infer<typeof createSchema>;

export type ActionResult = { success: true; orderId: number } | { success: false; error: string };

export async function createClientOrder(input: CreateOrderInput): Promise<ActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." };
  }
  const data = parsed.data;

  // 수량이 1 이상인 라인만 저장
  const lines = data.lines.filter((l) => l.qtyUnits > 0 || l.qtyBoxes > 0);
  if (lines.length === 0) {
    return { success: false, error: "수량을 하나 이상 입력하세요." };
  }

  try {
    const order = await prisma.clientOrder.create({
      data: {
        clientId: data.clientId,
        roundNo: data.roundNo,
        roundLabel: data.roundLabel,
        orderDate: new Date(data.orderDate),
        taxInvoiceDate: data.taxInvoiceDate ? new Date(data.taxInvoiceDate) : null,
        memo: data.memo ?? null,
        lines: { createMany: { data: lines } },
      },
    });
    revalidatePath("/orders");
    revalidatePath("/");
    return { success: true, orderId: order.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 실패";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return { success: false, error: "같은 클라이언트의 동일 차수가 이미 존재합니다." };
    }
    return { success: false, error: msg };
  }
}

export async function deleteClientOrder(orderId: number): Promise<void> {
  await prisma.clientOrder.delete({ where: { id: orderId } });
  revalidatePath("/orders");
  revalidatePath("/");
  redirect("/orders");
}
