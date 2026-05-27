"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ActionResult = { success: true } | { success: false; error: string };

function ok(): ActionResult {
  return { success: true };
}

function err(e: unknown, ctx: string): ActionResult {
  const msg = e instanceof Error ? e.message : "실패";
  if (msg.includes("Unique") || msg.includes("unique")) {
    return { success: false, error: `${ctx} — 동일한 이름이 이미 있습니다.` };
  }
  return { success: false, error: msg };
}

function revalidateAll() {
  revalidatePath("/masters/clients");
  revalidatePath("/masters/sites");
  revalidatePath("/masters/items");
  revalidatePath("/masters/vendors");
  revalidatePath("/masters/locations");
  revalidatePath("/");
}

// ──────────── 클라이언트 ────────────

const clientSchema = z.object({
  name: z.string().min(1).max(50),
  code: z.string().min(1).max(20),
  active: z.boolean().default(true),
});

export async function createClient(input: z.infer<typeof clientSchema>): Promise<ActionResult> {
  const p = clientSchema.safeParse(input);
  if (!p.success) return { success: false, error: p.error.issues[0]?.message ?? "잘못된 입력" };
  try {
    await prisma.client.create({ data: p.data });
    revalidateAll();
    return ok();
  } catch (e) {
    return err(e, "클라이언트");
  }
}

export async function updateClient(
  id: number,
  input: z.infer<typeof clientSchema>
): Promise<ActionResult> {
  const p = clientSchema.safeParse(input);
  if (!p.success) return { success: false, error: p.error.issues[0]?.message ?? "잘못된 입력" };
  try {
    await prisma.client.update({ where: { id }, data: p.data });
    revalidateAll();
    return ok();
  } catch (e) {
    return err(e, "클라이언트");
  }
}

// ──────────── 사업소 ────────────

const siteSchema = z.object({
  clientId: z.number().int().positive(),
  name: z.string().min(1).max(80),
  address: z.string().max(255).nullable().optional(),
  contactName: z.string().max(50).nullable().optional(),
  contactPhone: z.string().max(30).nullable().optional(),
  active: z.boolean().default(true),
});

export async function createSite(input: z.infer<typeof siteSchema>): Promise<ActionResult> {
  const p = siteSchema.safeParse(input);
  if (!p.success) return { success: false, error: p.error.issues[0]?.message ?? "잘못된 입력" };
  try {
    await prisma.site.create({
      data: {
        clientId: p.data.clientId,
        name: p.data.name,
        address: p.data.address ?? null,
        contactName: p.data.contactName ?? null,
        contactPhone: p.data.contactPhone ?? null,
        active: p.data.active,
      },
    });
    revalidateAll();
    return ok();
  } catch (e) {
    return err(e, "사업소");
  }
}

export async function updateSite(
  id: number,
  input: z.infer<typeof siteSchema>
): Promise<ActionResult> {
  const p = siteSchema.safeParse(input);
  if (!p.success) return { success: false, error: p.error.issues[0]?.message ?? "잘못된 입력" };
  try {
    await prisma.site.update({
      where: { id },
      data: {
        clientId: p.data.clientId,
        name: p.data.name,
        address: p.data.address ?? null,
        contactName: p.data.contactName ?? null,
        contactPhone: p.data.contactPhone ?? null,
        active: p.data.active,
      },
    });
    revalidateAll();
    return ok();
  } catch (e) {
    return err(e, "사업소");
  }
}

// ──────────── 품목 ────────────

const itemSchema = z.object({
  name: z.string().min(1).max(80),
  category: z.string().max(30).nullable().optional(),
  unit: z.string().min(1).max(10),
  unitsPerBox: z.number().int().positive(),
  active: z.boolean().default(true),
});

export async function createItem(input: z.infer<typeof itemSchema>): Promise<ActionResult> {
  const p = itemSchema.safeParse(input);
  if (!p.success) return { success: false, error: p.error.issues[0]?.message ?? "잘못된 입력" };
  try {
    await prisma.item.create({
      data: { ...p.data, category: p.data.category ?? null },
    });
    revalidateAll();
    return ok();
  } catch (e) {
    return err(e, "품목");
  }
}

export async function updateItem(
  id: number,
  input: z.infer<typeof itemSchema>
): Promise<ActionResult> {
  const p = itemSchema.safeParse(input);
  if (!p.success) return { success: false, error: p.error.issues[0]?.message ?? "잘못된 입력" };
  try {
    await prisma.item.update({
      where: { id },
      data: { ...p.data, category: p.data.category ?? null },
    });
    revalidateAll();
    return ok();
  } catch (e) {
    return err(e, "품목");
  }
}

// ──────────── 업체 ────────────

const vendorSchema = z.object({
  name: z.string().min(1).max(80),
  category: z.string().max(30).nullable().optional(),
  contactName: z.string().max(50).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  account: z.string().max(120).nullable().optional(),
  active: z.boolean().default(true),
});

export async function createVendor(input: z.infer<typeof vendorSchema>): Promise<ActionResult> {
  const p = vendorSchema.safeParse(input);
  if (!p.success) return { success: false, error: p.error.issues[0]?.message ?? "잘못된 입력" };
  try {
    await prisma.vendor.create({
      data: {
        name: p.data.name,
        category: p.data.category ?? null,
        contactName: p.data.contactName ?? null,
        phone: p.data.phone ?? null,
        address: p.data.address ?? null,
        account: p.data.account ?? null,
        active: p.data.active,
      },
    });
    revalidateAll();
    return ok();
  } catch (e) {
    return err(e, "업체");
  }
}

export async function updateVendor(
  id: number,
  input: z.infer<typeof vendorSchema>
): Promise<ActionResult> {
  const p = vendorSchema.safeParse(input);
  if (!p.success) return { success: false, error: p.error.issues[0]?.message ?? "잘못된 입력" };
  try {
    await prisma.vendor.update({
      where: { id },
      data: {
        name: p.data.name,
        category: p.data.category ?? null,
        contactName: p.data.contactName ?? null,
        phone: p.data.phone ?? null,
        address: p.data.address ?? null,
        account: p.data.account ?? null,
        active: p.data.active,
      },
    });
    revalidateAll();
    return ok();
  } catch (e) {
    return err(e, "업체");
  }
}

// ──────────── 보관위치 ────────────

const locationSchema = z.object({
  name: z.string().min(1).max(80),
  kind: z.enum(["warehouse", "onsite", "vendor"]),
  active: z.boolean().default(true),
});

export async function createLocation(
  input: z.infer<typeof locationSchema>
): Promise<ActionResult> {
  const p = locationSchema.safeParse(input);
  if (!p.success) return { success: false, error: p.error.issues[0]?.message ?? "잘못된 입력" };
  try {
    await prisma.stockLocation.create({ data: p.data });
    revalidateAll();
    return ok();
  } catch (e) {
    return err(e, "보관위치");
  }
}

export async function updateLocation(
  id: number,
  input: z.infer<typeof locationSchema>
): Promise<ActionResult> {
  const p = locationSchema.safeParse(input);
  if (!p.success) return { success: false, error: p.error.issues[0]?.message ?? "잘못된 입력" };
  try {
    await prisma.stockLocation.update({ where: { id }, data: p.data });
    revalidateAll();
    return ok();
  } catch (e) {
    return err(e, "보관위치");
  }
}
