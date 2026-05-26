import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import { Badge } from "@/components/table";
import { formatDate } from "@/lib/format";
import DeleteOrderButton from "./DeleteOrderButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) notFound();

  const order = await prisma.clientOrder.findUnique({
    where: { id: orderId },
    include: {
      client: true,
      lines: {
        include: { item: true, site: true },
        orderBy: [{ siteId: "asc" }, { itemId: "asc" }],
      },
    },
  });
  if (!order) notFound();

  // 사업소 × 품목 매트릭스로 변환
  const siteIds = Array.from(new Set(order.lines.map((l) => l.siteId)));
  const itemIds = Array.from(new Set(order.lines.map((l) => l.itemId)));
  const sites = siteIds.map((sid) => order.lines.find((l) => l.siteId === sid)!.site);
  const items = itemIds.map((iid) => order.lines.find((l) => l.itemId === iid)!.item);

  const get = (siteId: number, itemId: number) =>
    order.lines.find((l) => l.siteId === siteId && l.itemId === itemId);

  const totalBoxes = order.lines.reduce((s, l) => s + l.qtyBoxes, 0);
  const totalUnits = order.lines.reduce((s, l) => s + l.qtyUnits, 0);

  return (
    <>
      <PageHeader
        title={`${order.client.name} · ${order.roundLabel}`}
        description={`발주일 ${formatDate(order.orderDate)}`}
        actions={
          <div className="flex gap-2">
            <Link
              href="/orders"
              className="rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] px-4 py-2 text-[13px] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)]"
            >
              목록으로
            </Link>
            <DeleteOrderButton orderId={order.id} />
          </div>
        }
      />
      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <InfoCard label="클라이언트" value={<Badge tone="info">{order.client.name}</Badge>} />
          <InfoCard label="차수" value={order.roundLabel} />
          <InfoCard label="총 박스" value={`${totalBoxes.toLocaleString()}박스`} />
          <InfoCard label="총 개수" value={`${totalUnits.toLocaleString()}개`} />
          <InfoCard label="발주일" value={formatDate(order.orderDate)} />
          <InfoCard
            label="세금계산서"
            value={order.taxInvoiceDate ? formatDate(order.taxInvoiceDate) : "—"}
          />
          {order.memo && <InfoCard label="메모" value={order.memo} span={2} />}
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h3 className="text-[14px] font-bold">사업소 × 품목 분배</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)] min-w-[140px]">사업소</th>
                  {items.map((it) => (
                    <th key={it.id} className="px-3 py-3 text-center font-semibold min-w-[100px]">
                      <div>{it.name}</div>
                      <div className="text-[10.5px] font-normal text-[var(--color-ink-faint)]">
                        박스당 {it.unitsPerBox.toLocaleString()}
                        {it.unit}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="px-4 py-3 font-semibold">{s.name}</td>
                    {items.map((it) => {
                      const line = get(s.id, it.id);
                      if (!line || line.qtyBoxes === 0) {
                        return (
                          <td key={it.id} className="px-3 py-3 text-center text-[var(--color-ink-faint)]">
                            —
                          </td>
                        );
                      }
                      return (
                        <td key={it.id} className="px-3 py-3 text-center tabular-nums">
                          <div className="font-semibold">{line.qtyBoxes.toLocaleString()}박스</div>
                          <div className="text-[10.5px] text-[var(--color-ink-faint)]">
                            {line.qtyUnits.toLocaleString()}
                            {it.unit}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </>
  );
}

function InfoCard({
  label,
  value,
  span = 1,
}: {
  label: string;
  value: React.ReactNode;
  span?: number;
}) {
  return (
    <div
      className={
        "rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] " +
        (span === 2 ? "col-span-2" : "")
      }
    >
      <div className="text-[11px] text-[var(--color-ink-faint)] mb-1">{label}</div>
      <div className="text-[14px] font-semibold">{value}</div>
    </div>
  );
}
