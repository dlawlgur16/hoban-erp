import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import { Badge, DataTable } from "@/components/table";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VendorOrdersPage() {
  const client = await getCurrentClient();

  const vendorOrders = await prisma.vendorOrder.findMany({
    where: { relatedClientOrder: { clientId: client.id } },
    orderBy: [{ orderDate: "desc" }, { id: "desc" }],
    include: {
      vendor: true,
      relatedClientOrder: { include: { client: true } },
      lines: { include: { item: true } },
    },
  });

  const rows = vendorOrders.map((vo) => {
    const totalBoxes = vo.lines.reduce((s, l) => s + l.qtyBoxes, 0);
    const totalUnits = vo.lines.reduce((s, l) => s + l.qtyUnits, 0);
    const allReceived = vo.lines.every((l) => l.receivedDate != null);
    const anyReceived = vo.lines.some((l) => l.receivedDate != null);
    const status: "received" | "partial" | "pending" = allReceived
      ? "received"
      : anyReceived
      ? "partial"
      : "pending";
    return { ...vo, totalBoxes, totalUnits, status };
  });

  return (
    <>
      <PageHeader
        title={`${client.name} 업체 발주`}
        description="공장(업체)에 의뢰한 제작 발주. 입고일을 라인별로 체크하면 재고에 반영됩니다."
        actions={
          <Link
            href="/vendor-orders/new"
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90 whitespace-nowrap"
          >
            + 새 업체 발주
          </Link>
        }
      />
      <Section>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          empty={`${client.name}의 업체 발주가 없습니다.`}
          columns={[
            { key: "date", header: "발주일", cell: (r) => formatDate(r.orderDate) },
            {
              key: "vendor",
              header: "업체",
              cell: (r) => <span className="font-semibold">{r.vendor.name}</span>,
            },
            {
              key: "related",
              header: "연결된 차수",
              cell: (r) =>
                r.relatedClientOrder ? (
                  <Link
                    href={`/orders/${r.relatedClientOrder.id}`}
                    className="text-[var(--color-info)] hover:underline"
                  >
                    {r.relatedClientOrder.roundLabel}
                  </Link>
                ) : (
                  "—"
                ),
            },
            { key: "items", header: "품목", align: "right", cell: (r) => `${r.lines.length}종` },
            {
              key: "boxes",
              header: "총 박스",
              align: "right",
              cell: (r) => r.totalBoxes.toLocaleString(),
            },
            {
              key: "status",
              header: "상태",
              align: "center",
              cell: (r) =>
                r.status === "received" ? (
                  <Badge tone="positive">전체 입고</Badge>
                ) : r.status === "partial" ? (
                  <Badge tone="warning">일부 입고</Badge>
                ) : (
                  <Badge>입고 대기</Badge>
                ),
            },
            { key: "memo", header: "메모", cell: (r) => r.memo ?? "—" },
            {
              key: "actions",
              header: "",
              align: "right",
              cell: (r) => (
                <Link
                  href={`/vendor-orders/${r.id}`}
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
