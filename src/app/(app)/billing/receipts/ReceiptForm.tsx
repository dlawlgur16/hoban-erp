"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClientReceipt } from "../actions";

interface ClientOrderOption {
  id: number;
  roundLabel: string;
}

interface ReceiptFormProps {
  clientId: number;
  clientOrders: ReadonlyArray<ClientOrderOption>;
}

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[13.5px] outline-none focus:border-[var(--color-accent)]";

export default function ReceiptForm({ clientId, clientOrders }: ReceiptFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [clientOrderId, setClientOrderId] = useState<number>(0);
  const [subject, setSubject] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [receivedDate, setReceivedDate] = useState<string>("");
  const [memo, setMemo] = useState<string>("");

  function submit() {
    setError(null);
    setOkMsg(null);
    if (!subject.trim()) return setError("내용을 입력하세요.");
    const amt = parseInt(amount.replace(/[^0-9]/g, ""), 10);
    if (!Number.isFinite(amt) || amt < 0) return setError("금액을 숫자로 입력하세요.");

    startTransition(async () => {
      const res = await createClientReceipt({
        clientId,
        clientOrderId: clientOrderId || null,
        subject: subject.trim(),
        amount: amt,
        scheduledDate: scheduledDate || null,
        receivedDate: receivedDate || null,
        memo: memo.trim() || null,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setOkMsg("저장되었습니다.");
      setClientOrderId(0);
      setSubject("");
      setAmount("");
      setScheduledDate("");
      setReceivedDate("");
      setMemo("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="연결할 차수 (선택)">
          <select
            value={clientOrderId}
            onChange={(e) => setClientOrderId(Number(e.target.value))}
            className={inputClass}
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="예: 37,287,900"
            className={inputClass + " text-right tabular-nums"}
          />
        </Field>
        <div />
      </div>

      <Field label="내용">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="예: 4월 삼성 판촉물"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="입금 예정일 (선택)">
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="입금일 (선택)">
          <input
            type="date"
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="메모 (선택)">
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-[13px] min-h-[20px]">
          {error && <span className="text-[var(--color-danger)]">{error}</span>}
          {okMsg && <span className="text-[var(--color-positive)] font-semibold">✓ {okMsg}</span>}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="px-6 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-[var(--color-ink-faint)] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
