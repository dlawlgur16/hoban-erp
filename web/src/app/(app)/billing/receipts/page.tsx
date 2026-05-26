import { prisma } from "@/lib/prisma";
import { getCurrentClient } from "@/lib/clientContext";
import { PageHeader, Section } from "@/components/page";
import ReceiptForm from "./ReceiptForm";
import ReceiptRow from "./ReceiptRow";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const client = await getCurrentClient();
  const [receipts, clientOrders] = await Promise.all([
    prisma.clientReceipt.findMany({
      where: { clientId: client.id },
      orderBy: [{ receivedDate: { sort: "desc", nulls: "first" } }, { scheduledDate: "desc" }, { id: "desc" }],
      include: { clientOrder: true },
    }),
    prisma.clientOrder.findMany({
      where: { clientId: client.id },
      orderBy: { orderDate: "desc" },
    }),
  ]);

  const totalScheduled = receipts.filter((r) => !r.receivedDate).reduce((s, r) => s + r.amount, 0);
  const totalReceived = receipts.filter((r) => r.receivedDate).reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <PageHeader
        title={`${client.name} 입금 관리`}
        description={`${client.name}으로부터 받는 입금을 관리합니다.`}
      />

      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <SummaryCard label="입금 예정" amount={totalScheduled} tone="warning" />
          <SummaryCard label="입금 완료" amount={totalReceived} tone="positive" />
          <SummaryCard label="합계" amount={totalScheduled + totalReceived} tone="default" />
        </div>
      </Section>

      <Section title="새 입금 등록">
        <ReceiptForm
          clientId={client.id}
          clientOrders={clientOrders.map((co) => ({
            id: co.id,
            roundLabel: co.roundLabel,
          }))}
        />
      </Section>

      <Section title="입금 내역">
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
         <div className="overflow-x-auto">
          <table className="w-full text-[13px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">내용</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">차수</th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">금액</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink-faint)] w-[180px]">
                  입금일
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[var(--color-ink-faint)]"
                  >
                    등록된 입금 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <ReceiptRow
                    key={r.id}
                    receipt={{
                      id: r.id,
                      subject: r.subject,
                      roundLabel: r.clientOrder?.roundLabel ?? null,
                      amount: r.amount,
                      scheduledDate: r.scheduledDate ? r.scheduledDate.toISOString().slice(0, 10) : null,
                      receivedDate: r.receivedDate ? r.receivedDate.toISOString().slice(0, 10) : null,
                      memo: r.memo ?? null,
                    }}
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
