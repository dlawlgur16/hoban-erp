import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import ItemsTable from "./ItemsTable";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await prisma.item.findMany({ orderBy: { id: "asc" } });

  return (
    <>
      <PageHeader title="품목" description="판촉물 품목 마스터입니다." />
      <Section>
        <ItemsTable
          rows={items.map((it) => ({
            id: it.id,
            name: it.name,
            category: it.category,
            unit: it.unit,
            unitsPerBox: it.unitsPerBox,
            active: it.active,
          }))}
        />
      </Section>
    </>
  );
}
