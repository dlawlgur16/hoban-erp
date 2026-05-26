import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import DeliveryForm from "../../_components/DeliveryForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDeliveryPage({ params }: PageProps) {
  const { id } = await params;
  const deliveryId = Number(id);
  if (!Number.isFinite(deliveryId)) notFound();

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { client: true, lines: true },
  });
  if (!delivery) notFound();

  const [items, sites, orderLines, otherDeliveryLines, locations] = await Promise.all([
    prisma.item.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.site.findMany({
      where: { active: true, clientId: delivery.clientId },
      orderBy: { id: "asc" },
    }),
    prisma.clientOrderLine.findMany({ where: { order: { clientId: delivery.clientId } } }),
    // 본인 배송 라인은 잔량 계산에서 제외 (수정 시 본인 영향 받지 않게)
    prisma.deliveryLine.findMany({
      where: {
        delivery: { clientId: delivery.clientId },
        deliveryId: { not: deliveryId },
      },
      include: { delivery: { select: { siteId: true } } },
    }),
    prisma.stockLocation.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
  ]);

  const stockMap = new Map<string, { ordered: number; delivered: number }>();
  const key = (siteId: number, itemId: number) => `${siteId}-${itemId}`;
  for (const ol of orderLines) {
    const k = key(ol.siteId, ol.itemId);
    const cur = stockMap.get(k) ?? { ordered: 0, delivered: 0 };
    cur.ordered += ol.qtyBoxes;
    stockMap.set(k, cur);
  }
  for (const dl of otherDeliveryLines) {
    const k = key(dl.delivery.siteId, dl.itemId);
    const cur = stockMap.get(k) ?? { ordered: 0, delivered: 0 };
    cur.delivered += dl.qtyBoxes;
    stockMap.set(k, cur);
  }
  const stockData: Array<{ key: string; ordered: number; delivered: number }> = [];
  for (const [k, v] of stockMap.entries())
    stockData.push({ key: k, ordered: v.ordered, delivered: v.delivered });

  return (
    <>
      <PageHeader
        title={`${delivery.client.name} 배송 수정`}
        description="모든 필드 수정 가능. 잔량은 본인 배송을 제외하고 계산됩니다."
      />
      <Section>
        <DeliveryForm
          mode="edit"
          client={{ id: delivery.client.id, name: delivery.client.name }}
          initial={{
            id: delivery.id,
            siteId: delivery.siteId,
            deliveryDate: delivery.deliveryDate.toISOString().slice(0, 10),
            deliveryTime: delivery.deliveryTime,
            courier: delivery.courier,
            clientContact: delivery.clientContact,
            memo: delivery.memo,
            fromLocationId: delivery.lines[0]?.fromLocationId ?? null,
            lines: delivery.lines.map((l) => ({ itemId: l.itemId, qtyBoxes: l.qtyBoxes })),
          }}
          items={items.map((i) => ({ id: i.id, name: i.name, unit: i.unit, unitsPerBox: i.unitsPerBox }))}
          sites={sites.map((s) => ({ id: s.id, name: s.name }))}
          locations={locations.map((l) => ({ id: l.id, name: l.name }))}
          stockData={stockData}
        />
      </Section>
    </>
  );
}
