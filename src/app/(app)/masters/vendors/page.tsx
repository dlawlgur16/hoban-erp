import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import VendorsTable from "./VendorsTable";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({ orderBy: { id: "asc" } });
  return (
    <>
      <PageHeader title="업체(공장)" description="제작·납품 협력업체 마스터입니다." />
      <Section>
        <VendorsTable
          rows={vendors.map((v) => ({
            id: v.id,
            name: v.name,
            category: v.category,
            contactName: v.contactName,
            phone: v.phone,
            address: v.address,
            account: v.account,
            active: v.active,
          }))}
        />
      </Section>
    </>
  );
}
