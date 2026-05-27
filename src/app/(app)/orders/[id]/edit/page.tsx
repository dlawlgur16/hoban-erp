import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import OrderForm from "../../_components/OrderForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrderPage({ params }: PageProps) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) notFound();

  const [order, items, sites] = await Promise.all([
    prisma.clientOrder.findUnique({
      where: { id: orderId },
      include: { client: true, lines: true },
    }),
    prisma.item.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.site.findMany({ where: { active: true }, orderBy: [{ clientId: "asc" }, { id: "asc" }] }),
  ]);
  if (!order) notFound();

  const filteredSites = sites.filter((s) => s.clientId === order.clientId);

  return (
    <>
      <PageHeader
        title={`${order.client.name} 발주 수정`}
        description={`${order.roundLabel} 차수의 모든 사업소·품목 분배를 수정할 수 있습니다.`}
      />
      <Section>
        <OrderForm
          mode="edit"
          client={{ id: order.client.id, name: order.client.name }}
          initial={{
            id: order.id,
            roundNo: order.roundNo,
            roundLabel: order.roundLabel,
            orderDate: order.orderDate.toISOString().slice(0, 10),
            taxInvoiceDate: order.taxInvoiceDate ? order.taxInvoiceDate.toISOString().slice(0, 10) : null,
            memo: order.memo,
            lines: order.lines.map((l) => ({
              siteId: l.siteId,
              itemId: l.itemId,
              qtyBoxes: l.qtyBoxes,
            })),
          }}
          items={items.map((i) => ({ id: i.id, name: i.name, unit: i.unit, unitsPerBox: i.unitsPerBox }))}
          sites={filteredSites.map((s) => ({ id: s.id, name: s.name }))}
        />
      </Section>
    </>
  );
}
