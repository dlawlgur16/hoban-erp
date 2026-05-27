import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import { DataTable } from "@/components/table";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const client = await getCurrentClient();
  const deliveries = await prisma.delivery.findMany({
    where: { clientId: client.id },
    orderBy: [{ deliveryDate: "desc" }, { id: "desc" }],
    include: { site: true },
  });

  return (
    <>
      <PageHeader
        title={`${client.name} 입고/배송`}
        description="사업소로 인도된 판촉물을 기록합니다. 발주 잔량이 자동으로 차감됩니다."
        actions={
          <Link
            href="/deliveries/new"
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90 whitespace-nowrap"
          >
            + 새 배송 등록
          </Link>
        }
      />
      <Section>
        <DataTable
          rows={deliveries}
          rowKey={(r) => r.id}
          empty={`${client.name}의 등록된 배송이 없습니다.`}
          columns={[
            { key: "date", header: "배송일", cell: (r) => formatDate(r.deliveryDate) },
            { key: "site", header: "사업소", cell: (r) => <span className="font-semibold">{r.site.name}</span> },
            { key: "contact", header: "담당자", cell: (r) => r.clientContact ?? "—" },
            { key: "courier", header: "운송", cell: (r) => r.courier ?? "—" },
            {
              key: "actions",
              header: "",
              align: "right",
              cell: (r) => (
                <Link
                  href={`/deliveries/${r.id}`}
                  className="text-[12.5px] text-[var(--color-info)] hover:underline"
                >
                  상세
                </Link>
              ),
            },
          ]}
        />
      </Section>
    </>
  );
}
