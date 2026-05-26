import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import { Badge, DataTable } from "@/components/table";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const client = await getCurrentClient();
  const sites = await prisma.site.findMany({
    where: { clientId: client.id },
    orderBy: { id: "asc" },
  });

  return (
    <>
      <PageHeader title={`${client.name} 사업소`} description="배송지 마스터입니다." />
      <Section>
        <DataTable
          rows={sites}
          rowKey={(r) => r.id}
          columns={[
            { key: "name", header: "사업소명", cell: (r) => <span className="font-semibold">{r.name}</span> },
            { key: "address", header: "주소", cell: (r) => r.address ?? "—" },
            { key: "contact", header: "담당자", cell: (r) => r.contactName ?? "—" },
            { key: "phone", header: "연락처", cell: (r) => r.contactPhone ?? "—" },
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
