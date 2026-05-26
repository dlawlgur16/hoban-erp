import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import ClientsTable from "./ClientsTable";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { sites: true, orders: true } } },
  });

  return (
    <>
      <PageHeader title="클라이언트" description="발주처(고객사) 목록입니다." />
      <Section>
        <ClientsTable
          rows={clients.map((c) => ({
            id: c.id,
            name: c.name,
            code: c.code,
            siteCount: c._count.sites,
            orderCount: c._count.orders,
            active: c.active,
          }))}
        />
      </Section>
    </>
  );
}
