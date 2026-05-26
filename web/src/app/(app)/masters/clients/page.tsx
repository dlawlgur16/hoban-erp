import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import { Badge, DataTable } from "@/components/table";

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
        <DataTable
          rows={clients}
          rowKey={(r) => r.id}
          columns={[
            { key: "name", header: "이름", cell: (r) => <span className="font-semibold">{r.name}</span> },
            { key: "code", header: "코드", cell: (r) => <span className="font-mono text-[12.5px]">{r.code}</span> },
            { key: "sites", header: "사업소 수", align: "right", cell: (r) => `${r._count.sites}곳` },
            { key: "orders", header: "누적 발주", align: "right", cell: (r) => `${r._count.orders}차수` },
            {
              key: "active",
              header: "상태",
              align: "center",
              cell: (r) =>
                r.active ? <Badge tone="positive">사용중</Badge> : <Badge tone="danger">비활성</Badge>,
            },
          ]}
        />
      </Section>
    </>
  );
}
