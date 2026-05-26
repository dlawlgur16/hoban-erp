import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import VendorOrderForm from "../../_components/VendorOrderForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVendorOrderPage({ params }: PageProps) {
  const { id } = await params;
  const voId = Number(id);
  if (!Number.isFinite(voId)) notFound();

  const client = await getCurrentClient();
  const [vo, vendors, items, clientOrders] = await Promise.all([
    prisma.vendorOrder.findUnique({
      where: { id: voId },
      include: { lines: true },
    }),
    prisma.vendor.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.item.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.clientOrder.findMany({
      where: { clientId: client.id },
      orderBy: { orderDate: "desc" },
    }),
  ]);
  if (!vo) notFound();

  return (
    <>
      <PageHeader title="업체 발주 수정" description="모든 필드 수정 가능합니다." />
      <Section>
        <VendorOrderForm
          mode="edit"
          client={{ id: client.id, name: client.name }}
          initial={{
            id: vo.id,
            vendorId: vo.vendorId,
            relatedClientOrderId: vo.relatedClientOrderId,
            orderDate: vo.orderDate.toISOString().slice(0, 10),
            paidDate: vo.paidDate ? vo.paidDate.toISOString().slice(0, 10) : null,
            memo: vo.memo,
            lines: vo.lines.map((l) => ({ itemId: l.itemId, qtyBoxes: l.qtyBoxes })),
          }}
          vendors={vendors.map((v) => ({ id: v.id, name: v.name, category: v.category ?? "" }))}
          items={items.map((i) => ({ id: i.id, name: i.name, unit: i.unit, unitsPerBox: i.unitsPerBox }))}
          clientOrders={clientOrders.map((co) => ({ id: co.id, roundLabel: co.roundLabel }))}
        />
      </Section>
    </>
  );
}
