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
  clientId: z.number().int().positive(),
  siteId: z.number().int().positive(),
  fromLocationId: z.number().int().positive().nullable().optional(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deliveryTime: z.string().max(10).nullable().optional(),
  courier: z.string().max(80).nullable().optional(),
  clientContact: z.string().max(80).nullable().optional(),
  memo: z.string().max(2000).nullable().optional(),
  lines: z.array(lineSchema).min(1),
});

export type CreateDeliveryInput = z.infer<typeof createSchema>;

export type ActionResult =
  | { success: true; deliveryId: number }
  | { success: false; error: string };

export async function createDelivery(input: CreateDeliveryInput): Promise<ActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
    };
  }
  const data = parsed.data;

  const lines = data.lines.filter((l) => l.qtyUnits > 0 || l.qtyBoxes > 0);
  if (lines.length === 0) {
    return { success: false, error: "수량을 하나 이상 입력하세요." };
  }

  try {
    const fromLocationId = data.fromLocationId ?? null;
    const delivery = await prisma.delivery.create({
      data: {
        clientId: data.clientId,
        siteId: data.siteId,
        deliveryDate: new Date(data.deliveryDate),
        deliveryTime: data.deliveryTime ?? null,
        courier: data.courier ?? null,
        clientContact: data.clientContact ?? null,
        memo: data.memo ?? null,
        lines: {
          createMany: {
            data: lines.map((l) => ({ ...l, fromLocationId })),
          },
        },
      },
    });
    revalidatePath("/deliveries");
    revalidatePath("/stock");
    revalidatePath("/");
    return { success: true, deliveryId: delivery.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 실패";
    return { success: false, error: msg };
  }
}

export async function deleteDelivery(deliveryId: number): Promise<void> {
  await prisma.delivery.delete({ where: { id: deliveryId } });
  revalidatePath("/deliveries");
  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/deliveries");
}

const updateSchema = createSchema.extend({
  id: z.number().int().positive(),
});

export type UpdateDeliveryInput = z.infer<typeof updateSchema>;

export async function updateDelivery(input: UpdateDeliveryInput): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }
  const data = parsed.data;
  const lines = data.lines.filter((l) => l.qtyUnits > 0 || l.qtyBoxes > 0);
  if (lines.length === 0) return { success: false, error: "수량을 하나 이상 입력하세요." };

  try {
    const fromLocationId = data.fromLocationId ?? null;
    await prisma.$transaction([
      prisma.deliveryLine.deleteMany({ where: { deliveryId: data.id } }),
      prisma.delivery.update({
        where: { id: data.id },
        data: {
          clientId: data.clientId,
          siteId: data.siteId,
          deliveryDate: new Date(data.deliveryDate),
          deliveryTime: data.deliveryTime ?? null,
          courier: data.courier ?? null,
          clientContact: data.clientContact ?? null,
          memo: data.memo ?? null,
        },
      }),
      prisma.deliveryLine.createMany({
        data: lines.map((l) => ({ ...l, deliveryId: data.id, fromLocationId })),
      }),
    ]);
    revalidatePath("/deliveries");
    revalidatePath(`/deliveries/${data.id}`);
    revalidatePath("/stock");
    revalidatePath("/");
    return { success: true, deliveryId: data.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "수정 실패" };
  }
}
