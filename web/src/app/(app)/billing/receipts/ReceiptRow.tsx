"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markReceiptReceived, deleteClientReceipt } from "../actions";
import { Badge } from "@/components/table";
import { todayISO } from "@/lib/format";

interface ReceiptRowProps {
  receipt: {
    id: number;
    subject: string;
    roundLabel: string | null;
    amount: number;
    scheduledDate: string | null;
    receivedDate: string | null;
    memo: string | null;
  };
}

export default function ReceiptRow({ receipt }: ReceiptRowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [receivedDate, setReceivedDate] = useState<string>(receipt.receivedDate ?? "");

  function saveReceived(newDate: string) {
    setReceivedDate(newDate);
    startTransition(async () => {
      await markReceiptReceived(receipt.id, newDate || null);
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm("이 입금 내역을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteClientReceipt(receipt.id);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-[var(--color-border)] last:border-b-0">
      <td className="px-4 py-3">
        <div className="font-semibold">{receipt.subject}</div>
        {receipt.memo && (
          <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">{receipt.memo}</div>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {receipt.roundLabel ? <Badge tone="info">{receipt.roundLabel}</Badge> : "—"}
      </td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold whitespace-nowrap">
        {receipt.amount.toLocaleString()}원
      </td>
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {receivedDate ? (
          <div className="flex items-center gap-1 justify-center">
            <input
              type="date"
              disabled={pending}
              value={receivedDate}
              onChange={(e) => saveReceived(e.target.value)}
              className="text-[12px] rounded-[6px] px-2 py-1 border border-[var(--color-positive)] bg-[#e6f5ef] text-[var(--color-positive)] outline-none"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => saveReceived("")}
              className="text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-danger)]"
              title="입금 취소"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            {receipt.scheduledDate && (
              <span className="text-[11px] text-[var(--color-warning)]">
                예정 {receipt.scheduledDate}
              </span>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => saveReceived(todayISO())}
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
