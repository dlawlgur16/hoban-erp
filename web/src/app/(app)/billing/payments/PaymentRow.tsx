"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPaymentPaid, deleteVendorPayment } from "../actions";
import { Badge } from "@/components/table";
import { todayISO } from "@/lib/format";

interface PaymentRowProps {
  payment: {
    id: number;
    vendorName: string;
    subject: string;
    amount: number;
    vatIncluded: boolean;
    account: string | null;
    scheduledDate: string | null;
    paidDate: string | null;
    memo: string | null;
  };
}

export default function PaymentRow({ payment }: PaymentRowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paidDate, setPaidDate] = useState<string>(payment.paidDate ?? "");

  function savePaid(newDate: string) {
    setPaidDate(newDate);
    startTransition(async () => {
      await markPaymentPaid(payment.id, newDate || null);
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm("이 지불 내역을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteVendorPayment(payment.id);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-[var(--color-border)] last:border-b-0">
      <td className="px-4 py-3 font-semibold whitespace-nowrap">{payment.vendorName}</td>
      <td className="px-4 py-3">
        <div className="text-[13px]">{payment.subject}</div>
        {payment.memo && (
          <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">{payment.memo}</div>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold whitespace-nowrap">
        {payment.amount.toLocaleString()}원
      </td>
      <td className="px-4 py-3 text-center whitespace-nowrap">
        {payment.vatIncluded ? <Badge tone="info">포함</Badge> : <Badge>별도</Badge>}
      </td>
      <td className="px-4 py-3 text-[12px] text-[var(--color-ink-muted)] whitespace-nowrap">
        {payment.account ?? "—"}
      </td>
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {paidDate ? (
          <div className="flex items-center gap-1 justify-center">
            <input
              type="date"
              disabled={pending}
              value={paidDate}
              onChange={(e) => savePaid(e.target.value)}
              className="text-[12px] rounded-[6px] px-2 py-1 border border-[var(--color-positive)] bg-[#e6f5ef] text-[var(--color-positive)] outline-none"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => savePaid("")}
              className="text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-danger)]"
              title="입금 취소"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            {payment.scheduledDate && (
              <span className="text-[11px] text-[var(--color-warning)]">
                예정 {payment.scheduledDate}
              </span>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => savePaid(todayISO())}
              className="text-[12px] rounded-[6px] px-3 py-1 bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] hover:bg-[var(--color-border)] disabled:opacity-40"
            >
              오늘 입금 체크
            </button>
          </div>
        )}
      </td>
      <td className="px-3 py-3 text-right">
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="text-[var(--color-ink-faint)] hover:text-[var(--color-danger)] text-[15px]"
          title="삭제"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
