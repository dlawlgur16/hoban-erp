import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import { Badge } from "@/components/table";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const client = await getCurrentClient();

  const [
    itemsAll,
    orders,
    orderLines,
    deliveries,
    deliveryLines,
    pendingPayments,
    pendingReceipts,
  ] = await Promise.all([
    prisma.item.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.clientOrder.findMany({
      where: { clientId: client.id },
      orderBy: [{ roundNo: "desc" }],
    }),
    prisma.clientOrderLine.findMany({
      where: { order: { clientId: client.id } },
    }),
    prisma.delivery.findMany({
      where: { clientId: client.id },
      orderBy: [{ deliveryDate: "desc" }, { id: "desc" }],
      take: 5,
      include: { site: true, lines: true },
    }),
    prisma.deliveryLine.findMany({
      where: { delivery: { clientId: client.id } },
    }),
    prisma.vendorPayment.findMany({
      where: { clientId: client.id, paidDate: null },
      include: { vendor: true },
      orderBy: { scheduledDate: "asc" },
    }),
    prisma.clientReceipt.findMany({
      where: { clientId: client.id, receivedDate: null },
      include: { clientOrder: true },
      orderBy: { scheduledDate: "asc" },
    }),
  ]);

  // 품목별 잔량 + 진행률
  const itemTotals = new Map<number, { ordered: number; delivered: number }>();
  for (const it of itemsAll) itemTotals.set(it.id, { ordered: 0, delivered: 0 });
  for (const l of orderLines) itemTotals.get(l.itemId)!.ordered += l.qtyBoxes;
  for (const l of deliveryLines) itemTotals.get(l.itemId)!.delivered += l.qtyBoxes;
  const itemBars = itemsAll
    .map((it) => {
      const t = itemTotals.get(it.id)!;
      return {
        id: it.id,
        name: it.name,
        ordered: t.ordered,
        delivered: t.delivered,
        remaining: t.ordered - t.delivered,
        progress: t.ordered > 0 ? Math.min(100, Math.round((t.delivered / t.ordered) * 100)) : 0,
      };
    })
    .filter((b) => b.ordered > 0);

  // 차수별 박스 합계 (목록용)
  const orderBoxMap = new Map<number, number>();
  for (const l of orderLines) {
    orderBoxMap.set(l.orderId, (orderBoxMap.get(l.orderId) ?? 0) + l.qtyBoxes);
  }

  return (
    <>
      <PageHeader
        title={`${client.name} 대시보드`}
        description="현재 컨텍스트의 발주·배송·정산 현황입니다."
      />

      <Section title="품목별 진행률" description="각 품목의 배송률(=배송/발주)을 시각화합니다.">
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] space-y-3.5">
          {itemBars.length === 0 ? (
            <div className="text-[13px] text-[var(--color-ink-faint)] text-center py-6">
              아직 발주가 없습니다.
            </div>
          ) : (
            itemBars.map((b) => (
              <div key={b.id}>
                <div className="flex items-baseline justify-between text-[13px] mb-1.5">
                  <div className="font-semibold">{b.name}</div>
                  <div className="tabular-nums text-[var(--color-ink-muted)]">
                    {b.delivered.toLocaleString()} / {b.ordered.toLocaleString()}박스 ·{" "}
                    <span
                      className={
                        b.remaining > 0
                          ? "text-[var(--color-positive)] font-semibold"
                          : "text-[var(--color-ink-faint)]"
                      }
                    >
                      잔량 {b.remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-accent)] transition-all"
                    style={{ width: `${b.progress}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-8 pb-6">
        {/* 진행 차수 */}
        <div>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[15px] font-bold">진행 차수</h2>
            <Link href="/orders" className="text-[12.5px] text-[var(--color-info)] hover:underline">
              전체 보기 →
            </Link>
          </div>
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-border)]">
            {orders.length === 0 ? (
              <div className="px-5 py-6 text-center text-[13px] text-[var(--color-ink-faint)]">
                등록된 차수가 없습니다.
              </div>
            ) : (
              orders.map((r) => (
                <Link
                  key={r.id}
                  href={`/orders/${r.id}`}
                  className="block px-5 py-3.5 hover:bg-[var(--color-surface-2)]"
                >
                  <div className="flex items-baseline justify-between">
                    <div className="font-semibold text-[14px]">{r.roundLabel}</div>
                    <div className="text-[12px] text-[var(--color-ink-faint)]">
                      {formatDate(r.orderDate)}
                    </div>
                  </div>
                  <div className="mt-1 text-[12.5px] text-[var(--color-ink-muted)] tabular-nums">
                    발주 {(orderBoxMap.get(r.id) ?? 0).toLocaleString()}박스
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 최근 배송 */}
        <div>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[15px] font-bold">최근 배송</h2>
            <Link href="/deliveries" className="text-[12.5px] text-[var(--color-info)] hover:underline">
              전체 보기 →
            </Link>
          </div>
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-border)]">
            {deliveries.length === 0 ? (
              <div className="px-5 py-6 text-center text-[13px] text-[var(--color-ink-faint)]">
                최근 배송이 없습니다.
              </div>
            ) : (
              deliveries.map((d) => {
                const totalBoxes = d.lines.reduce((s, l) => s + l.qtyBoxes, 0);
                return (
                  <Link
                    key={d.id}
                    href={`/deliveries/${d.id}`}
                    className="block px-5 py-3.5 hover:bg-[var(--color-surface-2)]"
                  >
                    <div className="flex items-baseline justify-between">
                      <div className="font-semibold text-[14px]">{d.site.name}</div>
                      <div className="text-[12px] text-[var(--color-ink-faint)]">
                        {formatDate(d.deliveryDate)}
                      </div>
                    </div>
                    <div className="mt-1 text-[12.5px] text-[var(--color-ink-muted)] tabular-nums">
                      {d.lines.length}종 · {totalBoxes.toLocaleString()}박스
                      {d.clientContact && (
                        <span className="text-[var(--color-ink-faint)]"> · {d.clientContact}</span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-8 pb-10">
        {/* 지급 예정 */}
        <div>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[15px] font-bold">지급 예정 (업체)</h2>
            <Link
              href="/billing/payments"
              className="text-[12.5px] text-[var(--color-info)] hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-border)]">
            {pendingPayments.length === 0 ? (
              <div className="px-5 py-6 text-center text-[13px] text-[var(--color-ink-faint)]">
                지급 대기 중인 건이 없습니다.
              </div>
            ) : (
              pendingPayments.slice(0, 5).map((p) => (
                <div key={p.id} className="px-5 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[13.5px]">{p.vendor.name}</div>
                      <div className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">{p.subject}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold tabular-nums text-[14px] text-[var(--color-warning)]">
                        {p.amount.toLocaleString()}원
                      </div>
                      {p.scheduledDate && (
                        <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">
                          예정 {formatDate(p.scheduledDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 입금 예정 */}
        <div>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[15px] font-bold">입금 예정 ({client.name})</h2>
            <Link
              href="/billing/receipts"
              className="text-[12.5px] text-[var(--color-info)] hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-border)]">
            {pendingReceipts.length === 0 ? (
              <div className="px-5 py-6 text-center text-[13px] text-[var(--color-ink-faint)]">
                입금 대기 중인 건이 없습니다.
              </div>
            ) : (
              pendingReceipts.slice(0, 5).map((r) => (
                <div key={r.id} className="px-5 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[13.5px]">{r.subject}</div>
                      {r.clientOrder && (
                        <div className="text-[11px] mt-0.5">
                          <Badge tone="info">{r.clientOrder.roundLabel}</Badge>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold tabular-nums text-[14px] text-[var(--color-warning)]">
                        {r.amount.toLocaleString()}원
                      </div>
                      {r.scheduledDate && (
                        <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">
                          예정 {formatDate(r.scheduledDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
