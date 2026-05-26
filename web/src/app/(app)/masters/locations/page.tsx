import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import { Badge, DataTable } from "@/components/table";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  warehouse: "창고(외부)",
  onsite: "사내 보관",
  vendor: "업체 보관",
};

export default async function LocationsPage() {
  const locations = await prisma.stockLocation.findMany({ orderBy: { id: "asc" } });

  return (
    <>
      <PageHeader
        title="보관위치"
        description="재고가 머무는 물리적 위치(천지로지스 · 회사 지하 · 업체 보관 등)입니다."
      />
      <Section>
        <DataTable
          rows={locations}
          rowKey={(r) => r.id}
          columns={[
            { key: "name", header: "위치명", cell: (r) => <span className="font-semibold">{r.name}</span> },
            {
              key: "kind",
              header: "유형",
              cell: (r) => <Badge tone="info">{KIND_LABEL[r.kind] ?? r.kind}</Badge>,
            },
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
