import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import { Badge } from "@/components/table";
import { formatDate } from "@/lib/format";
import PaymentForm from "./PaymentForm";
import PaymentRow from "./PaymentRow";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const client = await getCurrentClient();
  const [payments, vendors, vendorOrders] = await Promise.all([
    prisma.vendorPayment.findMany({
      where: { clientId: client.id },
      orderBy: [{ paidDate: { sort: "desc", nulls: "first" } }, { scheduledDate: "desc" }, { id: "desc" }],
      include: { vendor: true, vendorOrder: true },
    }),
    prisma.vendor.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.vendorOrder.findMany({
      where: { relatedClientOrder: { clientId: client.id } },
      orderBy: { orderDate: "desc" },
      include: { vendor: true },
    }),
  ]);

  // 합계
  const totalScheduled = payments.filter((p) => !p.paidDate).reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter((p) => p.paidDate).reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader
        title={`${client.name} 업체 지불`}
        description="업체(공장)에 대한 대금 정산을 관리합니다. 부가세 포함/별도 표시."
      />

      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <SummaryCard label="지급 예정" amount={totalScheduled} tone="warning" />
          <SummaryCard label="지급 완료" amount={totalPaid} tone="positive" />
          <SummaryCard label="합계" amount={totalScheduled + totalPaid} tone="default" />
        </div>
      </Section>

      <Section title="새 지불 등록">
        <PaymentForm
          clientId={client.id}
          vendors={vendors.map((v) => ({
            id: v.id,
            name: v.name,
            account: v.account ?? "",
          }))}
          vendorOrders={vendorOrders.map((vo) => ({
            id: vo.id,
            label: `${formatDate(vo.orderDate)} · ${vo.vendor.name}${
              vo.memo ? ` · ${vo.memo}` : ""
            }`,
          }))}
        />
      </Section>

      <Section title="지불 내역">
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
         <div className="overflow-x-auto">
          <table className="w-full text-[13px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">업체</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">내용</th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">금액</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink-faint)]">부가세</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">계좌</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink-faint)] w-[180px]">
                  입금일
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-[var(--color-ink-faint)]"
                  >
                    등록된 지불 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <PaymentRow
                    key={p.id}
                    clientId={client.id}
                    payment={{
                      id: p.id,
                      vendorId: p.vendorId,
                      vendorName: p.vendor.name,
                      vendorOrderId: p.vendorOrderId,
                      subject: p.subject,
                      amount: p.amount,
                      vatIncluded: p.vatIncluded,
                      account: p.account ?? null,
                      scheduledDate: p.scheduledDate ? p.scheduledDate.toISOString().slice(0, 10) : null,
                      paidDate: p.paidDate ? p.paidDate.toISOString().slice(0, 10) : null,
                      memo: p.memo ?? null,
                    }}
                    vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
                    vendorOrders={vendorOrders.map((vo) => ({
                      id: vo.id,
                      label: `${vo.orderDate.toISOString().slice(0, 10)} · ${vo.vendor.name}${vo.memo ? " · " + vo.memo : ""}`,
                    }))}
                  />
                ))
              )}
            </tbody>
          </table>
         </div>
        </div>
      </Section>
    </>
  );
}

function SummaryCard({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "default" | "positive" | "warning";
}) {
  const color =
    tone === "positive"
      ? "text-[var(--color-positive)]"
      : tone === "warning"
      ? "text-[var(--color-warning)]"
      : "text-[var(--color-ink)]";
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="text-[12px] text-[var(--color-ink-faint)]">{label}</div>
      <div className={"mt-2 text-[24px] font-bold tabular-nums " + color}>
        {amount.toLocaleString()}원
      </div>
    </div>
  );
}
