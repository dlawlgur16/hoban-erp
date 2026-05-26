import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import LocationsTable from "./LocationsTable";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await prisma.stockLocation.findMany({ orderBy: { id: "asc" } });
  return (
    <>
      <PageHeader
        title="보관위치"
        description="재고가 머무는 물리적 위치(천지로지스 · 회사 지하 · 업체 보관 등)입니다."
      />
      <Section>
        <LocationsTable
          rows={locations.map((l) => ({
            id: l.id,
            name: l.name,
            kind: l.kind,
            active: l.active,
          }))}
        />
      </Section>
    </>
  );
}
