import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import { Badge, DataTable } from "@/components/table";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await prisma.item.findMany({ orderBy: { id: "asc" } });

  return (
    <>
      <PageHeader title="품목" description="판촉물 품목 마스터입니다." />
      <Section>
        <DataTable
          rows={items}
          rowKey={(r) => r.id}
          columns={[
            { key: "name", header: "품목명", cell: (r) => <span className="font-semibold">{r.name}</span> },
            {
              key: "category",
              header: "분류",
              cell: (r) => (r.category ? <Badge>{r.category}</Badge> : "—"),
            },
            { key: "unit", header: "단위", align: "center", cell: (r) => r.unit },
            {
              key: "box",
              header: "박스당 수량",
              align: "right",
              cell: (r) => `${r.unitsPerBox.toLocaleString()}${r.unit}`,
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
