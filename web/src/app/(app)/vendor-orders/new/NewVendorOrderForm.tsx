"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVendorOrder } from "../actions";
import { todayISO } from "@/lib/format";

interface ClientInfo {
  id: number;
  name: string;
}
interface VendorOption {
  id: number;
  name: string;
  category: string;
}
interface ItemOption {
  id: number;
  name: string;
  unit: string;
  unitsPerBox: number;
}
interface ClientOrderOption {
  id: number;
  roundLabel: string;
}

interface NewVendorOrderFormProps {
  client: ClientInfo;
  vendors: ReadonlyArray<VendorOption>;
  items: ReadonlyArray<ItemOption>;
  clientOrders: ReadonlyArray<ClientOrderOption>;
}

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[13.5px] outline-none focus:border-[var(--color-accent)]";

export default function NewVendorOrderForm({
  client,
  vendors,
  items,
  clientOrders,
}: NewVendorOrderFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [vendorId, setVendorId] = useState<number>(0);
  const [relatedClientOrderId, setRelatedClientOrderId] = useState<number>(0);
  const [orderDate, setOrderDate] = useState<string>(todayISO());
  const [paidDate, setPaidDate] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [boxesByItem, setBoxesByItem] = useState<Record<number, string>>({});

  function submit() {
    setError(null);
    if (!vendorId) return setError("업체를 선택하세요.");
    if (!orderDate) return setError("발주일을 입력하세요.");

    type Line = { itemId: number; qtyBoxes: number; qtyUnits: number };
    const lines: Line[] = [];
    for (const it of items) {
      const b = parseInt(boxesByItem[it.id] ?? "", 10);
      if (Number.isFinite(b) && b > 0) {
        lines.push({ itemId: it.id, qtyBoxes: b, qtyUnits: b * it.unitsPerBox });
      }
    }
    if (lines.length === 0) return setError("수량을 하나 이상 입력하세요.");

    startTransition(async () => {
      const res = await createVendorOrder({
        vendorId,
        relatedClientOrderId: relatedClientOrderId || null,
        orderDate,
        paidDate: paidDate || null,
        memo: memo.trim() || null,
        lines,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.push("/vendor-orders");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="업체">
            <select
              value={vendorId}
              onChange={(e) => setVendorId(Number(e.target.value))}
              className={inputClass}
            >
              <option value={0}>선택하세요</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.category ? `(${v.category})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`연결할 ${client.name} 차수 (선택)`}>
            <select
              value={relatedClientOrderId}
              onChange={(e) => setRelatedClientOrderId(Number(e.target.value))}
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
          <Field label="발주일">
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="대금 지급일 (선택)">
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
            placeholder="예: 호반 3차 미용티슈 (본사·면목·자양) 6,000개"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-[14px] font-bold">품목별 발주 수량</h3>
          <p className="text-[12px] text-[var(--color-ink-faint)] mt-1">박스 단위로 입력하세요.</p>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">품목</th>
              <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink-faint)] w-[140px]">
                수량 (박스)
              </th>
              <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">
                개수
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const boxesStr = boxesByItem[it.id] ?? "";
              const boxes = parseInt(boxesStr, 10) || 0;
              const units = boxes * it.unitsPerBox;
              return (
                <tr key={it.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-[11px] text-[var(--color-ink-faint)]">
                      박스당 {it.unitsPerBox.toLocaleString()}
                      {it.unit}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      value={boxesStr}
                      onChange={(e) =>
                        setBoxesByItem((m) => ({ ...m, [it.id]: e.target.value }))
                      }
                      placeholder="0"
                      className="w-24 px-2 py-1.5 rounded-[6px] border border-[var(--color-border-strong)] text-right tabular-nums text-[13px] focus:border-[var(--color-accent)] outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-ink-faint)]">
                    {boxes > 0 ? `${units.toLocaleString()}${it.unit}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="text-[13px] text-[var(--color-danger)] min-h-[20px]">{error}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/vendor-orders")}
            className="px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[13.5px] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !vendorId}
            className="px-6 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "저장 중..." : "전체 저장"}
          </button>
        </div>
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
