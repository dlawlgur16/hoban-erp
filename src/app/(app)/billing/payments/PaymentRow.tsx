"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markPaymentPaid,
  deleteVendorPayment,
  updateVendorPayment,
} from "../actions";
import { Badge } from "@/components/table";
import { todayISO } from "@/lib/format";

interface PaymentRowProps {
  clientId: number;
  payment: {
    id: number;
    vendorId: number;
    vendorName: string;
    vendorOrderId: number | null;
    subject: string;
    amount: number;
    vatIncluded: boolean;
    account: string | null;
    scheduledDate: string | null;
    paidDate: string | null;
    memo: string | null;
  };
  vendors: ReadonlyArray<{ id: number; name: string }>;
  vendorOrders: ReadonlyArray<{ id: number; label: string }>;
}

const inputBase =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-accent)]";

export default function PaymentRow({
  clientId,
  payment,
  vendors,
  vendorOrders,
}: PaymentRowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 모드 상태
  const [eVendorId, setEVendorId] = useState<number>(payment.vendorId);
  const [eVendorOrderId, setEVendorOrderId] = useState<number>(payment.vendorOrderId ?? 0);
  const [eSubject, setESubject] = useState<string>(payment.subject);
  const [eAmount, setEAmount] = useState<string>(String(payment.amount));
  const [eVatIncluded, setEVatIncluded] = useState<boolean>(payment.vatIncluded);
  const [eAccount, setEAccount] = useState<string>(payment.account ?? "");
  const [eScheduledDate, setEScheduledDate] = useState<string>(payment.scheduledDate ?? "");
  const [ePaidDate, setEPaidDate] = useState<string>(payment.paidDate ?? "");
  const [eMemo, setEMemo] = useState<string>(payment.memo ?? "");

  function startEdit() {
    setEVendorId(payment.vendorId);
    setEVendorOrderId(payment.vendorOrderId ?? 0);
    setESubject(payment.subject);
    setEAmount(String(payment.amount));
    setEVatIncluded(payment.vatIncluded);
    setEAccount(payment.account ?? "");
    setEScheduledDate(payment.scheduledDate ?? "");
    setEPaidDate(payment.paidDate ?? "");
    setEMemo(payment.memo ?? "");
    setError(null);
    setEditing(true);
  }

  function saveEdit() {
    setError(null);
    const amt = parseInt(eAmount.replace(/[^0-9]/g, ""), 10);
    if (!Number.isFinite(amt) || amt < 0) return setError("금액을 숫자로 입력하세요.");
    if (!eSubject.trim()) return setError("내용을 입력하세요.");
    if (!eVendorId) return setError("업체를 선택하세요.");

    startTransition(async () => {
      const res = await updateVendorPayment({
        id: payment.id,
        clientId,
        vendorId: eVendorId,
        vendorOrderId: eVendorOrderId || null,
        subject: eSubject.trim(),
        amount: amt,
        vatIncluded: eVatIncluded,
        account: eAccount.trim() || null,
        scheduledDate: eScheduledDate || null,
        paidDate: ePaidDate || null,
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

  function savePaid(newDate: string) {
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

  if (editing) {
    return (
      <tr className="border-b border-[var(--color-border)] last:border-b-0 bg-[var(--color-surface-2)]">
        <td colSpan={7} className="px-4 py-4 whitespace-normal">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <Field label="업체">
              <select
                value={eVendorId}
                onChange={(e) => setEVendorId(Number(e.target.value))}
                className={inputBase}
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="연결 업체발주">
              <select
                value={eVendorOrderId}
                onChange={(e) => setEVendorOrderId(Number(e.target.value))}
                className={inputBase}
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
                value={eAmount}
                onChange={(e) => setEAmount(e.target.value)}
                className={inputBase + " text-right tabular-nums"}
              />
            </Field>
            <Field label="부가세">
              <div className="flex gap-2 pt-1.5">
                <ToggleSmall active={eVatIncluded} onClick={() => setEVatIncluded(true)}>
                  포함
                </ToggleSmall>
                <ToggleSmall active={!eVatIncluded} onClick={() => setEVatIncluded(false)}>
                  별도
                </ToggleSmall>
              </div>
            </Field>
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
            <Field label="계좌">
              <input
                type="text"
                value={eAccount}
                onChange={(e) => setEAccount(e.target.value)}
                className={inputBase}
              />
            </Field>
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
                value={ePaidDate}
                onChange={(e) => setEPaidDate(e.target.value)}
                className={inputBase}
              />
            </Field>
          </div>
          <Field label="메모">
            <input
              type="text"
              value={eMemo}
              onChange={(e) => setEMemo(e.target.value)}
              className={inputBase}
            />
          </Field>
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
        {payment.paidDate ? (
          <input
            type="date"
            disabled={pending}
            value={payment.paidDate}
            onChange={(e) => savePaid(e.target.value)}
            className="text-[12px] rounded-[6px] px-2 py-1 border border-[var(--color-positive)] bg-[#e6f5ef] text-[var(--color-positive)] outline-none"
          />
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

function ToggleSmall({
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
        "flex-1 py-1.5 rounded-[var(--radius-md)] text-[12px] font-semibold " +
        (active
          ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
          : "bg-[var(--color-surface-2)] text-[var(--color-ink-muted)]")
      }
    >
      {children}
    </button>
  );
}
