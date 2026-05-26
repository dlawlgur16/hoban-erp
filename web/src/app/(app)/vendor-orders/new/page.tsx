import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import VendorOrderForm from "../_components/VendorOrderForm";

export const dynamic = "force-dynamic";

export default async function NewVendorOrderPage() {
  const client = await getCurrentClient();
  const [vendors, items, clientOrders] = await Promise.all([
    prisma.vendor.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.item.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.clientOrder.findMany({
      where: { clientId: client.id },
      orderBy: { orderDate: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title={`${client.name} 업체 발주 등록`}
        description="제작·납품을 의뢰할 업체와 품목별 수량을 입력합니다."
      />
      <Section>
        <VendorOrderForm
          mode="create"
          client={{ id: client.id, name: client.name }}
          vendors={vendors.map((v) => ({ id: v.id, name: v.name, category: v.category ?? "" }))}
          items={items.map((i) => ({ id: i.id, name: i.name, unit: i.unit, unitsPerBox: i.unitsPerBox }))}
          clientOrders={clientOrders.map((co) => ({ id: co.id, roundLabel: co.roundLabel }))}
        />
      </Section>
    </>
  );
}
