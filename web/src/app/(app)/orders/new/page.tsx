import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import OrderForm from "../_components/OrderForm";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const client = await getCurrentClient();
  const [items, sites, lastRound] = await Promise.all([
    prisma.item.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.site.findMany({
      where: { active: true, clientId: client.id },
      orderBy: { id: "asc" },
    }),
    prisma.clientOrder.findFirst({
      where: { clientId: client.id },
      orderBy: { roundNo: "desc" },
      select: { roundNo: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title={`${client.name} 발주 등록`}
        description="차수를 입력한 후 사업소별로 품목 수량을 일괄 입력합니다."
      />
      <Section>
        <OrderForm
          mode="create"
          client={{ id: client.id, name: client.name }}
          nextRoundNo={(lastRound?.roundNo ?? 0) + 1}
          items={items.map((i) => ({ id: i.id, name: i.name, unit: i.unit, unitsPerBox: i.unitsPerBox }))}
          sites={sites.map((s) => ({ id: s.id, name: s.name }))}
        />
      </Section>
    </>
  );
}
