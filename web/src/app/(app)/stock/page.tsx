import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";

export const dynamic = "force-dynamic";

interface CellTotal {
  orderedBoxes: number;
  orderedUnits: number;
  deliveredBoxes: number;
  deliveredUnits: number;
}

export default async function StockPage() {
  const client = await getCurrentClient();
  const [
    items,
    sites,
    locations,
    orderLines,
    deliveryLines,
    receivedVendorLines,
  ] = await Promise.all([
    prisma.item.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.site.findMany({
      where: { active: true, clientId: client.id },
      orderBy: { id: "asc" },
    }),
    prisma.stockLocation.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
    }),
    prisma.clientOrderLine.findMany({
      where: { order: { clientId: client.id } },
    }),
    prisma.deliveryLine.findMany({
      where: { delivery: { clientId: client.id } },
      include: { delivery: { select: { siteId: true } } },
    }),
    // 현재 클라이언트의 업체 발주 중 입고 완료된 라인
    prisma.vendorOrderLine.findMany({
      where: {
        receivedDate: { not: null },
        receivedLocationId: { not: null },
        vendorOrder: {
          relatedClientOrder: { clientId: client.id },
        },
      },
    }),
  ]);

  // 품목별 합계 (현재 클라, 발주 vs 배송)
  const grandTotals: Record<number, CellTotal> = {};
  for (const it of items) {
    grandTotals[it.id] = { orderedBoxes: 0, orderedUnits: 0, deliveredBoxes: 0, deliveredUnits: 0 };
  }
  for (const ol of orderLines) {
    grandTotals[ol.itemId].orderedBoxes += ol.qtyBoxes;
    grandTotals[ol.itemId].orderedUnits += ol.qtyUnits;
  }
  for (const dl of deliveryLines) {
    grandTotals[dl.itemId].deliveredBoxes += dl.qtyBoxes;
    grandTotals[dl.itemId].deliveredUnits += dl.qtyUnits;
  }

  // 사업소 × 품목 잔량 매트릭스
  const siteItemKey = (s: number, i: number) => `${s}-${i}`;
  const siteItemTotals = new Map<string, CellTotal>();
  for (const s of sites) {
    for (const it of items) {
      siteItemTotals.set(siteItemKey(s.id, it.id), {
        orderedBoxes: 0,
        orderedUnits: 0,
        deliveredBoxes: 0,
        deliveredUnits: 0,
      });
    }
  }
  for (const ol of orderLines) {
    const t = siteItemTotals.get(siteItemKey(ol.siteId, ol.itemId));
    if (!t) continue;
    t.orderedBoxes += ol.qtyBoxes;
    t.orderedUnits += ol.qtyUnits;
  }
  for (const dl of deliveryLines) {
    const t = siteItemTotals.get(siteItemKey(dl.delivery.siteId, dl.itemId));
    if (!t) continue;
    t.deliveredBoxes += dl.qtyBoxes;
    t.deliveredUnits += dl.qtyUnits;
  }

  // 위치 × 품목 보유 재고 (현재 클라 기준)
  // 보유 = 업체에서 들어온 분(해당 위치) - 사업소로 나간 분(해당 위치)
  const locItemKey = (l: number, i: number) => `${l}-${i}`;
  const locItemTotals = new Map<number, number>(); // key: locItemKey 해시
  const locItemBoxes = new Map<string, number>();
  for (const loc of locations) {
    for (const it of items) {
      locItemBoxes.set(locItemKey(loc.id, it.id), 0);
    }
  }
  for (const r of receivedVendorLines) {
    if (r.receivedLocationId == null) continue;
    const k = locItemKey(r.receivedLocationId, r.itemId);
    locItemBoxes.set(k, (locItemBoxes.get(k) ?? 0) + r.qtyBoxes);
  }
  for (const dl of deliveryLines) {
    if (dl.fromLocationId == null) continue;
    const k = locItemKey(dl.fromLocationId, dl.itemId);
    locItemBoxes.set(k, (locItemBoxes.get(k) ?? 0) - dl.qtyBoxes);
  }
  // 위치별 합계
  const locTotals = new Map<number, number>();
  for (const loc of locations) {
    let sum = 0;
    for (const it of items) sum += locItemBoxes.get(locItemKey(loc.id, it.id)) ?? 0;
    locTotals.set(loc.id, sum);
  }

  return (
    <>
      <PageHeader
        title={`${client.name} 재고`}
        description="잔여 발주량(=발주−배송)과 보관위치별 실제 보유 재고를 함께 봅니다."
      />

      <Section
        title="위치별 보유 재고"
        description="업체에서 받은 분 − 사업소로 나간 분. 바로 출고 가능한 물량이 어디에 얼마나 있는지 확인."
      >
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  <th className="sticky left-0 bg-[var(--color-surface-2)] z-10 px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)] min-w-[120px]">
                    보관위치 \ 품목
                  </th>
                  {items.map((it) => (
                    <th
                      key={it.id}
                      className="px-3 py-3 text-center font-semibold text-[var(--color-ink)] min-w-[90px]"
                    >
                      {it.name}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-semibold text-[var(--color-ink-faint)] bg-[var(--color-surface-2)] min-w-[80px]">
                    합계
                  </th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="sticky left-0 bg-[var(--color-surface)] px-4 py-3 font-semibold">
                      {loc.name}
                    </td>
                    {items.map((it) => {
                      const v = locItemBoxes.get(locItemKey(loc.id, it.id)) ?? 0;
                      return (
                        <td key={it.id} className="px-3 py-3 text-center tabular-nums">
                          {v === 0 ? (
                            <span className="text-[var(--color-ink-faint)]">—</span>
                          ) : (
                            <span
                              className={
                                "font-bold " +
                                (v < 0
                                  ? "text-[var(--color-danger)]"
                                  : "text-[var(--color-positive)]")
                              }
                            >
                              {v.toLocaleString()}
                            </span>
                          )}
                          <div className="text-[10.5px] text-[var(--color-ink-faint)]">박스</div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-right tabular-nums font-bold bg-[var(--color-surface-2)]">
                      {(locTotals.get(loc.id) ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-[11.5px] text-[var(--color-ink-faint)] leading-5">
          음수가 나오면 업체 입고 처리 없이 출고한 경우입니다. 업체 발주 상세에서
          입고일+보관위치를 체크해 주세요.
        </p>
      </Section>

      <Section title="품목별 잔여 발주량" description="발주 누적 − 배송 누적">
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">품목</th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">발주 (박스)</th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">배송 (박스)</th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--color-positive)]">잔량 (박스)</th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">잔량 (개)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const t = grandTotals[it.id];
                  const remBoxes = t.orderedBoxes - t.deliveredBoxes;
                  const remUnits = t.orderedUnits - t.deliveredUnits;
                  if (t.orderedBoxes === 0) return null;
                  return (
                    <tr key={it.id} className="border-b border-[var(--color-border)] last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{it.name}</div>
                        <div className="text-[11px] text-[var(--color-ink-faint)]">
                          박스당 {it.unitsPerBox.toLocaleString()}
                          {it.unit}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{t.orderedBoxes.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--color-ink-faint)]">
                        {t.deliveredBoxes.toLocaleString()}
                      </td>
                      <td
                        className={
                          "px-4 py-3 text-right tabular-nums font-bold " +
                          (remBoxes <= 0
                            ? "text-[var(--color-ink-faint)]"
                            : "text-[var(--color-positive)]")
                        }
                      >
                        {remBoxes.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--color-ink-muted)]">
                        {remUnits.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section title="사업소별 잔량 매트릭스" description="사업소별 잔여 발주량(=발주−배송).">
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  <th className="sticky left-0 bg-[var(--color-surface-2)] z-10 px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)] min-w-[140px]">
                    사업소 \ 품목
                  </th>
                  {items.map((it) => (
                    <th
                      key={it.id}
                      className="px-3 py-3 text-center font-semibold text-[var(--color-ink)] min-w-[90px]"
                    >
                      {it.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="sticky left-0 bg-[var(--color-surface)] px-4 py-3 font-semibold">
                      {s.name}
                    </td>
                    {items.map((it) => {
                      const t = siteItemTotals.get(siteItemKey(s.id, it.id))!;
                      const rem = t.orderedBoxes - t.deliveredBoxes;
                      if (t.orderedBoxes === 0)
                        return (
                          <td key={it.id} className="px-3 py-3 text-center text-[var(--color-ink-faint)]">
                            —
                          </td>
                        );
                      return (
                        <td key={it.id} className="px-3 py-3 text-center tabular-nums">
                          <div
                            className={
                              "font-bold " +
                              (rem <= 0
                                ? "text-[var(--color-ink-faint)]"
                                : rem < t.orderedBoxes * 0.2
                                ? "text-[var(--color-warning)]"
                                : "text-[var(--color-positive)]")
                            }
                          >
                            {rem}
                          </div>
                          <div className="text-[10.5px] text-[var(--color-ink-faint)]">
                            /{t.orderedBoxes}
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
