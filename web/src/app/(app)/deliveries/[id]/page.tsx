import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Section } from "@/components/page";
import { Badge } from "@/components/table";
import { formatDate } from "@/lib/format";
import DeleteDeliveryButton from "./DeleteDeliveryButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeliveryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const deliveryId = Number(id);
  if (!Number.isFinite(deliveryId)) notFound();

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      client: true,
      site: true,
      lines: { include: { item: true }, orderBy: { itemId: "asc" } },
    },
  });
  if (!delivery) notFound();

  const totalBoxes = delivery.lines.reduce((s, l) => s + l.qtyBoxes, 0);
  const totalUnits = delivery.lines.reduce((s, l) => s + l.qtyUnits, 0);

  return (
    <>
      <PageHeader
        title={`${delivery.client.name} · ${delivery.site.name}`}
        description={`${formatDate(delivery.deliveryDate)}${delivery.deliveryTime ? " " + delivery.deliveryTime : ""}`}
        actions={
          <div className="flex gap-2">
            <Link
              href="/deliveries"
              className="rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] px-4 py-2 text-[13px] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)]"
            >
              목록으로
            </Link>
            <DeleteDeliveryButton deliveryId={delivery.id} />
          </div>
        }
      />
      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <InfoCard label="클라이언트" value={<Badge tone="info">{delivery.client.name}</Badge>} />
          <InfoCard label="사업소" value={delivery.site.name} />
          <InfoCard label="배송일" value={formatDate(delivery.deliveryDate)} />
          <InfoCard label="시간" value={delivery.deliveryTime ?? "—"} />
          <InfoCard label="담당자" value={delivery.clientContact ?? "—"} />
          <InfoCard label="운송업체" value={delivery.courier ?? "—"} />
          <InfoCard label="총 박스" value={`${totalBoxes.toLocaleString()}박스`} />
          <InfoCard label="총 개수" value={`${totalUnits.toLocaleString()}개`} />
          {delivery.memo && <InfoCard label="메모" value={delivery.memo} span={4} />}
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h3 className="text-[14px] font-bold">품목별 수량</h3>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">
                  품목
                </th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">
                  박스
                </th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">
                  개수
                </th>
              </tr>
            </thead>
            <tbody>
              {delivery.lines.map((l) => (
                <tr key={l.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-4 py-3 font-semibold">{l.item.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {l.qtyBoxes.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {l.qtyUnits.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
