import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import NewDeliveryForm from "./NewDeliveryForm";

export const dynamic = "force-dynamic";

export default async function NewDeliveryPage() {
  const client = await getCurrentClient();
  const [items, sites, orderLines, deliveryLines, locations] = await Promise.all([
    prisma.item.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.site.findMany({
      where: { active: true, clientId: client.id },
      orderBy: { id: "asc" },
    }),
    prisma.clientOrderLine.findMany({
      where: { order: { clientId: client.id } },
    }),
    prisma.deliveryLine.findMany({
      where: { delivery: { clientId: client.id } },
      include: { delivery: { select: { siteId: true } } },
    }),
    prisma.stockLocation.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
  ]);

  // (siteId, itemId) → { ordered, delivered } 누적 (현재 클라이언트 기준)
  const stockMap = new Map<string, { ordered: number; delivered: number }>();
  const key = (siteId: number, itemId: number) => `${siteId}-${itemId}`;

  for (const ol of orderLines) {
    const k = key(ol.siteId, ol.itemId);
    const cur = stockMap.get(k) ?? { ordered: 0, delivered: 0 };
    cur.ordered += ol.qtyBoxes;
    stockMap.set(k, cur);
  }
  for (const dl of deliveryLines) {
    const k = key(dl.delivery.siteId, dl.itemId);
    const cur = stockMap.get(k) ?? { ordered: 0, delivered: 0 };
    cur.delivered += dl.qtyBoxes;
    stockMap.set(k, cur);
  }

  const stockData: Array<{ key: string; ordered: number; delivered: number }> = [];
  for (const [k, v] of stockMap.entries()) {
    stockData.push({ key: k, ordered: v.ordered, delivered: v.delivered });
  }

  return (
    <>
      <PageHeader
        title={`${client.name} 배송 등록`}
        description="사업소를 고른 후 품목별 박스 수량을 입력합니다. 발주 잔량이 인라인으로 표시됩니다."
      />
      <Section>
        <NewDeliveryForm
          client={{ id: client.id, name: client.name }}
          items={items.map((i) => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
            unitsPerBox: i.unitsPerBox,
          }))}
          sites={sites.map((s) => ({ id: s.id, name: s.name }))}
          locations={locations.map((l) => ({ id: l.id, name: l.name }))}
          stockData={stockData}
        />
      </Section>
    </>
  );
}
