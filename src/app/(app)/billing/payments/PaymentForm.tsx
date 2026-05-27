"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVendorPayment } from "../actions";
import { todayISO } from "@/lib/format";

interface VendorOption {
  id: number;
  name: string;
  account: string;
}
interface VendorOrderOption {
  id: number;
  label: string;
}

interface PaymentFormProps {
  clientId: number;
  vendors: ReadonlyArray<VendorOption>;
  vendorOrders: ReadonlyArray<VendorOrderOption>;
}

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[13.5px] outline-none focus:border-[var(--color-accent)]";

export default function PaymentForm({ clientId, vendors, vendorOrders }: PaymentFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [vendorId, setVendorId] = useState<number>(0);
  const [vendorOrderId, setVendorOrderId] = useState<number>(0);
  const [subject, setSubject] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [vatIncluded, setVatIncluded] = useState<boolean>(true);
  const [account, setAccount] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [paidDate, setPaidDate] = useState<string>("");
  const [memo, setMemo] = useState<string>("");

  function onVendorChange(id: number) {
    setVendorId(id);
    const v = vendors.find((x) => x.id === id);
    if (v && v.account) setAccount(v.account);
  }

  function submit() {
    setError(null);
    setOkMsg(null);
    if (!vendorId) return setError("업체를 선택하세요.");
    if (!subject.trim()) return setError("내용을 입력하세요.");
    const amt = parseInt(amount.replace(/[^0-9]/g, ""), 10);
    if (!Number.isFinite(amt) || amt < 0) return setError("금액을 숫자로 입력하세요.");

    startTransition(async () => {
      const res = await createVendorPayment({
        vendorId,
        vendorOrderId: vendorOrderId || null,
        clientId,
        subject: subject.trim(),
        amount: amt,
        vatIncluded,
        account: account.trim() || null,
        scheduledDate: scheduledDate || null,
        paidDate: paidDate || null,
        memo: memo.trim() || null,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setOkMsg("저장되었습니다.");
      // reset
      setVendorId(0);
      setVendorOrderId(0);
      setSubject("");
      setAmount("");
      setAccount("");
      setScheduledDate("");
      setPaidDate("");
      setMemo("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Field label="업체">
          <select
            value={vendorId}
            onChange={(e) => onVendorChange(Number(e.target.value))}
            className={inputClass}
          >
            <option value={0}>선택하세요</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="연결할 업체 발주 (선택)">
          <select
            value={vendorOrderId}
            onChange={(e) => setVendorOrderId(Number(e.target.value))}
            className={inputClass}
          >
            <option value={0}>없음</option>
            {vendorOrders.map((vo) => (
              <option key={vo.id} value={vo.id}>
                {vo.label}
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
            placeholder="예: 4,880,700"
            className={inputClass + " text-right tabular-nums"}
          />
        </Field>
        <Field label="부가세">
          <div className="flex gap-2 pt-1.5">
            <Toggle active={vatIncluded} onClick={() => setVatIncluded(true)}>
              포함
            </Toggle>
            <Toggle active={!vatIncluded} onClick={() => setVatIncluded(false)}>
              별도
            </Toggle>
          </div>
        </Field>
      </div>

      <Field label="내용">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="예: 삼성 쇼핑백 5,100개 / 용산, 리모델링"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="계좌">
          <input
            type="text"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="예: 우리은행 1005-303-530501"
            className={inputClass}
          />
        </Field>
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
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="메모 (선택)">
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 5월 30일 선금 50%"
          className={inputClass}
        />
      </Field>

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

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 py-2 rounded-[var(--radius-md)] text-[13px] font-semibold " +
        (active
          ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
          : "bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] hover:bg-[var(--color-border)]")
      }
    >
      {children}
    </button>
  );
}
