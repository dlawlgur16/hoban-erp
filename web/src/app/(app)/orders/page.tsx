import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import { Badge, DataTable } from "@/components/table";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const client = await getCurrentClient();
  const orders = await prisma.clientOrder.findMany({
    where: { clientId: client.id },
    orderBy: [{ orderDate: "desc" }, { roundNo: "desc" }],
  });

  return (
    <>
      <PageHeader
        title={`${client.name} 발주 관리`}
        description="차수별 발주를 사업소별로 분배하여 관리합니다."
        actions={
          <Link
            href="/orders/new"
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90 whitespace-nowrap"
          >
            + 새 발주 등록
          </Link>
        }
      />
      <Section>
        <DataTable
          rows={orders}
          rowKey={(r) => r.id}
          empty={`${client.name}의 등록된 발주가 없습니다. 우측 상단에서 새 발주를 등록하세요.`}
          columns={[
            {
              key: "round",
              header: "차수",
              cell: (r) => <span className="font-semibold">{r.roundLabel}</span>,
            },
            { key: "orderDate", header: "발주일", cell: (r) => formatDate(r.orderDate) },
            {
              key: "tax",
              header: "세금계산서",
              cell: (r) => (r.taxInvoiceDate ? formatDate(r.taxInvoiceDate) : "—"),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              cell: (r) => (
                <Link
                  href={`/orders/${r.id}`}
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
