import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import { Badge, DataTable } from "@/components/table";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({ orderBy: { id: "asc" } });

  return (
    <>
      <PageHeader title="업체(공장)" description="제작·납품 협력업체 마스터입니다." />
      <Section>
        <DataTable
          rows={vendors}
          rowKey={(r) => r.id}
          columns={[
            { key: "name", header: "업체명", cell: (r) => <span className="font-semibold">{r.name}</span> },
            {
              key: "category",
              header: "분류",
              cell: (r) => (r.category ? <Badge>{r.category}</Badge> : "—"),
            },
            { key: "contact", header: "담당자", cell: (r) => r.contactName ?? "—" },
            { key: "phone", header: "연락처", cell: (r) => r.phone ?? "—" },
            { key: "address", header: "주소", cell: (r) => r.address ?? "—" },
          ]}
        />
      </Section>
    </>
  );
}
