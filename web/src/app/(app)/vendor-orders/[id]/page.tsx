import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import { Badge } from "@/components/table";
import { formatDate } from "@/lib/format";
import ReceivedToggle from "./ReceivedToggle";
import DeleteVendorOrderButton from "./DeleteVendorOrderButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VendorOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const voId = Number(id);
  if (!Number.isFinite(voId)) notFound();

  const [vo, locations] = await Promise.all([
    prisma.vendorOrder.findUnique({
      where: { id: voId },
      include: {
        vendor: true,
        relatedClientOrder: { include: { client: true } },
        lines: {
          include: { item: true, receivedLocation: true },
          orderBy: { itemId: "asc" },
        },
      },
    }),
    prisma.stockLocation.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
    }),
  ]);
  if (!vo) notFound();
  const locationOptions = locations.map((l) => ({ id: l.id, name: l.name }));

  const totalBoxes = vo.lines.reduce((s, l) => s + l.qtyBoxes, 0);
  const totalUnits = vo.lines.reduce((s, l) => s + l.qtyUnits, 0);

  return (
    <>
      <PageHeader
        title={`${vo.vendor.name} 발주`}
        description={formatDate(vo.orderDate)}
        actions={
          <div className="flex gap-2">
            <Link
              href="/vendor-orders"
              className="rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] px-4 py-2 text-[13px] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)]"
            >
              목록으로
            </Link>
            <DeleteVendorOrderButton vendorOrderId={vo.id} />
          </div>
        }
      />
      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <InfoCard label="업체" value={vo.vendor.name} />
          <InfoCard label="발주일" value={formatDate(vo.orderDate)} />
          <InfoCard label="총 박스" value={`${totalBoxes.toLocaleString()}박스`} />
          <InfoCard label="총 개수" value={`${totalUnits.toLocaleString()}개`} />
          <InfoCard
            label="연결 차수"
            value={
              vo.relatedClientOrder ? (
                <Link
                  href={`/orders/${vo.relatedClientOrder.id}`}
                  className="text-[var(--color-info)] hover:underline"
                >
                  <Badge tone="info">{vo.relatedClientOrder.client.name}</Badge>{" "}
                  {vo.relatedClientOrder.roundLabel}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <InfoCard
            label="대금 지급일"
            value={vo.paidDate ? formatDate(vo.paidDate) : "—"}
          />
          <InfoCard label="계좌" value={vo.vendor.account ?? "—"} span={2} />
          {vo.memo && <InfoCard label="메모" value={vo.memo} span={4} />}
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="text-[14px] font-bold">품목별 입고 처리</h3>
            <p className="text-[12px] text-[var(--color-ink-faint)]">
              입고일을 체크하면 재고에 반영됩니다.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">품목</th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">박스</th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">개수</th>
                  <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink-faint)]">
                    입고일 / 보관위치
                  </th>
                </tr>
              </thead>
              <tbody>
                {vo.lines.map((l) => (
                  <tr key={l.id} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="px-4 py-3 font-semibold">{l.item.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{l.qtyBoxes.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{l.qtyUnits.toLocaleString()}</td>
                    <td className="px-3 py-2 text-center">
                      <ReceivedToggle
                        lineId={l.id}
                        receivedDate={l.receivedDate ? l.receivedDate.toISOString().slice(0, 10) : null}
                        receivedLocationId={l.receivedLocationId}
                        locations={locationOptions}
                      />
                    </td>
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
        (span === 4 ? "col-span-4" : span === 2 ? "col-span-2" : "")
      }
    >
      <div className="text-[11px] text-[var(--color-ink-faint)] mb-1">{label}</div>
      <div className="text-[14px] font-semibold">{value}</div>
    </div>
  );
}
