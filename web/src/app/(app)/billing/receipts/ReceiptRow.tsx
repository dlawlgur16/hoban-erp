"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markReceiptReceived,
  deleteClientReceipt,
  updateClientReceipt,
} from "../actions";
import { Badge } from "@/components/table";
import { todayISO } from "@/lib/format";

interface ReceiptRowProps {
  clientId: number;
  receipt: {
    id: number;
    clientOrderId: number | null;
    subject: string;
    roundLabel: string | null;
    amount: number;
    scheduledDate: string | null;
    receivedDate: string | null;
    memo: string | null;
  };
  clientOrders: ReadonlyArray<{ id: number; roundLabel: string }>;
}

const inputBase =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-accent)]";

export default function ReceiptRow({ clientId, receipt, clientOrders }: ReceiptRowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eClientOrderId, setEClientOrderId] = useState<number>(receipt.clientOrderId ?? 0);
  const [eSubject, setESubject] = useState<string>(receipt.subject);
  const [eAmount, setEAmount] = useState<string>(String(receipt.amount));
  const [eScheduledDate, setEScheduledDate] = useState<string>(receipt.scheduledDate ?? "");
  const [eReceivedDate, setEReceivedDate] = useState<string>(receipt.receivedDate ?? "");
  const [eMemo, setEMemo] = useState<string>(receipt.memo ?? "");

  function startEdit() {
    setEClientOrderId(receipt.clientOrderId ?? 0);
    setESubject(receipt.subject);
    setEAmount(String(receipt.amount));
    setEScheduledDate(receipt.scheduledDate ?? "");
    setEReceivedDate(receipt.receivedDate ?? "");
    setEMemo(receipt.memo ?? "");
    setError(null);
    setEditing(true);
  }

  function saveEdit() {
    setError(null);
    const amt = parseInt(eAmount.replace(/[^0-9]/g, ""), 10);
    if (!Number.isFinite(amt) || amt < 0) return setError("금액을 숫자로 입력하세요.");
    if (!eSubject.trim()) return setError("내용을 입력하세요.");

    startTransition(async () => {
      const res = await updateClientReceipt({
        id: receipt.id,
        clientId,
        clientOrderId: eClientOrderId || null,
        subject: eSubject.trim(),
        amount: amt,
        scheduledDate: eScheduledDate || null,
        receivedDate: eReceivedDate || null,
        memo: eMemo.trim() || null,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function saveReceived(newDate: string) {
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

  if (editing) {
    return (
      <tr className="border-b border-[var(--color-border)] last:border-b-0 bg-[var(--color-surface-2)]">
        <td colSpan={5} className="px-4 py-4 whitespace-normal">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <Field label="연결 차수">
              <select
                value={eClientOrderId}
                onChange={(e) => setEClientOrderId(Number(e.target.value))}
                className={inputBase}
              >
                <option value={0}>없음</option>
                {clientOrders.map((co) => (
                  <option key={co.id} value={co.id}>
                    {co.roundLabel}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="금액 (원)">
              <input
                type="text"
                inputMode="numeric"
                value={eAmount}
                onChange={(e) => setEAmount(e.target.value)}
                className={inputBase + " text-right tabular-nums"}
              />
            </Field>
            <div />
          </div>
          <Field label="내용">
            <input
              type="text"
              value={eSubject}
              onChange={(e) => setESubject(e.target.value)}
              className={inputBase}
            />
          </Field>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            <Field label="입금 예정일">
              <input
                type="date"
                value={eScheduledDate}
                onChange={(e) => setEScheduledDate(e.target.value)}
                className={inputBase}
              />
            </Field>
            <Field label="입금일">
              <input
                type="date"
                value={eReceivedDate}
                onChange={(e) => setEReceivedDate(e.target.value)}
                className={inputBase}
              />
            </Field>
            <Field label="메모">
              <input
                type="text"
                value={eMemo}
                onChange={(e) => setEMemo(e.target.value)}
                className={inputBase}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="text-[13px] text-[var(--color-danger)] min-h-[20px]">{error}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={pending}
                className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[12.5px] text-[var(--color-ink-muted)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={pending}
                className="px-5 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-[12.5px] font-semibold disabled:opacity-40"
              >
                {pending ? "저장 중..." : "수정 저장"}
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
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
        {receipt.receivedDate ? (
          <input
            type="date"
            disabled={pending}
            value={receipt.receivedDate}
            onChange={(e) => saveReceived(e.target.value)}
            className="text-[12px] rounded-[6px] px-2 py-1 border border-[var(--color-positive)] bg-[#e6f5ef] text-[var(--color-positive)] outline-none"
          />
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
      <td className="px-3 py-3 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={startEdit}
          disabled={pending}
          className="text-[12px] text-[var(--color-info)] hover:underline mr-3"
        >
          수정
        </button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-[var(--color-ink-faint)] mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
