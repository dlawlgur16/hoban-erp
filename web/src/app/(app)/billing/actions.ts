"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ──────────── 업체 지불 ────────────

const paymentSchema = z.object({
  vendorId: z.number().int().positive(),
  vendorOrderId: z.number().int().positive().nullable().optional(),
  clientId: z.number().int().positive().nullable().optional(),
  subject: z.string().min(1).max(200),
  amount: z.number().int().nonnegative(),
  vatIncluded: z.boolean(),
  account: z.string().max(120).nullable().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  memo: z.string().max(2000).nullable().optional(),
});

export type CreatePaymentInput = z.infer<typeof paymentSchema>;
export type ActionResult = { success: true } | { success: false; error: string };

export async function createVendorPayment(input: CreatePaymentInput): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }
  const data = parsed.data;
  try {
    await prisma.vendorPayment.create({
      data: {
        vendorId: data.vendorId,
        vendorOrderId: data.vendorOrderId ?? null,
        clientId: data.clientId ?? null,
        subject: data.subject,
        amount: data.amount,
        vatIncluded: data.vatIncluded,
        account: data.account ?? null,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        memo: data.memo ?? null,
      },
    });
    revalidatePath("/billing/payments");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "저장 실패" };
  }
}

export async function markPaymentPaid(paymentId: number, paidDate: string | null): Promise<void> {
  await prisma.vendorPayment.update({
    where: { id: paymentId },
    data: { paidDate: paidDate ? new Date(paidDate) : null },
  });
  revalidatePath("/billing/payments");
  revalidatePath("/");
}

export async function deleteVendorPayment(paymentId: number): Promise<void> {
  await prisma.vendorPayment.delete({ where: { id: paymentId } });
  revalidatePath("/billing/payments");
  revalidatePath("/");
}

// ──────────── 클라이언트 입금 ────────────

const receiptSchema = z.object({
  clientId: z.number().int().positive(),
  clientOrderId: z.number().int().positive().nullable().optional(),
  subject: z.string().min(1).max(200),
  amount: z.number().int().nonnegative(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  memo: z.string().max(2000).nullable().optional(),
});

export type CreateReceiptInput = z.infer<typeof receiptSchema>;

export async function createClientReceipt(input: CreateReceiptInput): Promise<ActionResult> {
  const parsed = receiptSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }
  const data = parsed.data;
  try {
    await prisma.clientReceipt.create({
      data: {
        clientId: data.clientId,
        clientOrderId: data.clientOrderId ?? null,
        subject: data.subject,
        amount: data.amount,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
        memo: data.memo ?? null,
      },
    });
    revalidatePath("/billing/receipts");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "저장 실패" };
  }
}

export async function markReceiptReceived(
  receiptId: number,
  receivedDate: string | null
): Promise<void> {
  await prisma.clientReceipt.update({
    where: { id: receiptId },
    data: { receivedDate: receivedDate ? new Date(receivedDate) : null },
  });
  revalidatePath("/billing/receipts");
  revalidatePath("/");
}

export async function deleteClientReceipt(receiptId: number): Promise<void> {
  await prisma.clientReceipt.delete({ where: { id: receiptId } });
  revalidatePath("/billing/receipts");
  revalidatePath("/");
}
