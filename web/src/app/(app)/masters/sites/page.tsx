import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import SitesTable from "./SitesTable";

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
        <SitesTable
          clientId={client.id}
          clientName={client.name}
          rows={sites.map((s) => ({
            id: s.id,
            clientId: s.clientId,
            name: s.name,
            address: s.address,
            contactName: s.contactName,
            contactPhone: s.contactPhone,
            active: s.active,
          }))}
        />
      </Section>
    </>
  );
}
