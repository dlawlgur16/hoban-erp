"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const lineSchema = z.object({
  itemId: z.number().int().positive(),
  qtyUnits: z.number().int().nonnegative().default(0),
  qtyBoxes: z.number().int().nonnegative().default(0),
});

const createSchema = z.object({
  vendorId: z.number().int().positive(),
  relatedClientOrderId: z.number().int().positive().nullable().optional(),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  memo: z.string().max(2000).nullable().optional(),
  lines: z.array(lineSchema).min(1),
});

export type CreateVendorOrderInput = z.infer<typeof createSchema>;
export type ActionResult =
  | { success: true; vendorOrderId: number }
  | { success: false; error: string };

export async function createVendorOrder(input: CreateVendorOrderInput): Promise<ActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." };
  }
  const data = parsed.data;
  const lines = data.lines.filter((l) => l.qtyUnits > 0 || l.qtyBoxes > 0);
  if (lines.length === 0) return { success: false, error: "수량을 하나 이상 입력하세요." };

  try {
    const order = await prisma.vendorOrder.create({
      data: {
        vendorId: data.vendorId,
        relatedClientOrderId: data.relatedClientOrderId ?? null,
        orderDate: new Date(data.orderDate),
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        memo: data.memo ?? null,
        lines: { createMany: { data: lines } },
      },
    });
    revalidatePath("/vendor-orders");
    revalidatePath("/");
    return { success: true, vendorOrderId: order.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "저장 실패" };
  }
}

const receivedSchema = z.object({
  vendorOrderLineId: z.number().int().positive(),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  receivedLocationId: z.number().int().positive().nullable(),
});

export async function setLineReceived(input: z.infer<typeof receivedSchema>): Promise<ActionResult> {
  const parsed = receivedSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "잘못된 입력" };
  await prisma.vendorOrderLine.update({
    where: { id: parsed.data.vendorOrderLineId },
    data: {
      receivedDate: parsed.data.receivedDate ? new Date(parsed.data.receivedDate) : null,
      receivedLocationId: parsed.data.receivedLocationId,
    },
  });
  revalidatePath("/vendor-orders");
  revalidatePath("/stock");
  return { success: true, vendorOrderId: 0 };
}

export async function deleteVendorOrder(vendorOrderId: number): Promise<void> {
  await prisma.vendorOrder.delete({ where: { id: vendorOrderId } });
  revalidatePath("/vendor-orders");
  redirect("/vendor-orders");
}
