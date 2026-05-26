"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClientOrder } from "../actions";
import { todayISO } from "@/lib/format";

interface ClientInfo {
  id: number;
  name: string;
}
interface ItemOption {
  id: number;
  name: string;
  unit: string;
  unitsPerBox: number;
}
interface SiteOption {
  id: number;
  name: string;
}

interface NewOrderFormProps {
  client: ClientInfo;
  nextRoundNo: number;
  items: ReadonlyArray<ItemOption>;
  sites: ReadonlyArray<SiteOption>;
}

type CellKey = `${number}-${number}`;
type Matrix = Record<CellKey, { boxes: string }>;

function cellKey(siteId: number, itemId: number): CellKey {
  return `${siteId}-${itemId}` as CellKey;
}

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[13.5px] outline-none focus:border-[var(--color-accent)]";

export default function NewOrderForm({
  client,
  nextRoundNo,
  items,
  sites,
}: NewOrderFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [roundNo, setRoundNo] = useState<string>(String(nextRoundNo));
  const [roundLabel, setRoundLabel] = useState<string>(`${nextRoundNo}차 발주`);
  const [orderDate, setOrderDate] = useState<string>(todayISO());
  const [taxInvoiceDate, setTaxInvoiceDate] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [matrix, setMatrix] = useState<Matrix>({});

  function setCell(siteId: number, itemId: number, boxes: string) {
    setMatrix((m) => ({ ...m, [cellKey(siteId, itemId)]: { boxes } }));
  }
  function getBoxes(siteId: number, itemId: number): number {
    const v = matrix[cellKey(siteId, itemId)]?.boxes ?? "";
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  function itemTotal(itemId: number): { boxes: number; units: number } {
    const item = items.find((i) => i.id === itemId);
    let boxes = 0;
    for (const s of sites) boxes += getBoxes(s.id, itemId);
    return { boxes, units: boxes * (item?.unitsPerBox ?? 0) };
  }
  function siteTotal(siteId: number): { boxes: number; units: number } {
    let boxes = 0;
    let units = 0;
    for (const i of items) {
      const b = getBoxes(siteId, i.id);
      boxes += b;
      units += b * i.unitsPerBox;
    }
    return { boxes, units };
  }

  function submit() {
    setError(null);
    const rn = parseInt(roundNo, 10);
    if (!Number.isFinite(rn) || rn <= 0) {
      setError("차수 번호를 1 이상의 정수로 입력하세요.");
      return;
    }
    if (!roundLabel.trim()) {
      setError("차수 라벨을 입력하세요 (예: 1차 발주)");
      return;
    }
    if (!orderDate) {
      setError("발주일을 입력하세요.");
      return;
    }

    type Line = { siteId: number; itemId: number; qtyBoxes: number; qtyUnits: number };
    const lines: Line[] = [];
    for (const s of sites) {
      for (const i of items) {
        const b = getBoxes(s.id, i.id);
        if (b > 0) {
          lines.push({
            siteId: s.id,
            itemId: i.id,
            qtyBoxes: b,
            qtyUnits: b * i.unitsPerBox,
          });
        }
      }
    }
    if (lines.length === 0) {
      setError("수량을 하나 이상 입력하세요.");
      return;
    }

    startTransition(async () => {
      const res = await createClientOrder({
        clientId: client.id,
        roundNo: rn,
        roundLabel: roundLabel.trim(),
        orderDate,
        taxInvoiceDate: taxInvoiceDate || null,
        memo: memo.trim() || null,
        lines,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.push("/orders");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="차수 번호">
            <input
              type="number"
              min={1}
              value={roundNo}
              onChange={(e) => setRoundNo(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="차수 라벨">
            <input
              type="text"
              value={roundLabel}
              onChange={(e) => setRoundLabel(e.target.value)}
              placeholder="예: 1차 발주"
              className={inputClass}
            />
          </Field>
          <Field label="발주일">
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="세금계산서 발행일 (선택)">
            <input
              type="date"
              value={taxInvoiceDate}
              onChange={(e) => setTaxInvoiceDate(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="메모 (선택)">
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="특이사항"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="text-[14px] font-bold">
            {client.name} 사업소 × 품목 매트릭스
          </h3>
          <p className="text-[12px] text-[var(--color-ink-faint)]">
            박스 단위로 입력 — 개수는 자동 계산됩니다.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <th className="sticky left-0 bg-[var(--color-surface-2)] z-10 px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)] min-w-[160px]">
                  사업소 \ 품목
                </th>
                {items.map((it) => (
                  <th
                    key={it.id}
                    className="px-3 py-3 font-semibold text-[var(--color-ink)] text-center min-w-[110px]"
                  >
                    <div>{it.name}</div>
                    <div className="text-[11px] font-normal text-[var(--color-ink-faint)] mt-0.5">
                      박스당 {it.unitsPerBox.toLocaleString()}
                      {it.unit}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-semibold text-[var(--color-ink-faint)] bg-[var(--color-surface-2)] min-w-[100px]">
                  소계
                </th>
              </tr>
            </thead>
            <tbody>
              {sites.length === 0 ? (
                <tr>
                  <td colSpan={items.length + 2} className="px-4 py-12 text-center text-[var(--color-ink-faint)]">
                    {client.name}에 등록된 사업소가 없습니다.
                  </td>
                </tr>
              ) : (
                sites.map((s) => {
                  const total = siteTotal(s.id);
                  return (
                    <tr key={s.id} className="border-b border-[var(--color-border)] last:border-b-0">
                      <td className="sticky left-0 bg-[var(--color-surface)] px-4 py-2 font-semibold whitespace-nowrap">
                        {s.name}
                      </td>
                      {items.map((it) => {
                        const boxes = getBoxes(s.id, it.id);
                        const units = boxes * it.unitsPerBox;
                        return (
                          <td key={it.id} className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={matrix[cellKey(s.id, it.id)]?.boxes ?? ""}
                              onChange={(e) => setCell(s.id, it.id, e.target.value)}
                              placeholder="0"
                              className="w-20 px-2 py-1.5 rounded-[6px] border border-[var(--color-border-strong)] text-right tabular-nums text-[13px] focus:border-[var(--color-accent)] outline-none"
                            />
                            <div className="mt-0.5 text-[10.5px] text-[var(--color-ink-faint)] tabular-nums">
                              {boxes > 0 ? `${units.toLocaleString()}${it.unit}` : ""}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right tabular-nums bg-[var(--color-surface-2)] font-semibold">
                        <div>{total.boxes.toLocaleString()}박스</div>
                        <div className="text-[10.5px] font-normal text-[var(--color-ink-faint)]">
                          {total.units.toLocaleString()}개
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--color-border-strong)] bg-[var(--color-surface-2)]">
                <td className="sticky left-0 bg-[var(--color-surface-2)] px-4 py-3 font-bold">합계</td>
                {items.map((it) => {
                  const total = itemTotal(it.id);
                  return (
                    <td key={it.id} className="px-3 py-3 text-center tabular-nums font-semibold">
                      <div>{total.boxes.toLocaleString()}박스</div>
                      <div className="text-[10.5px] font-normal text-[var(--color-ink-faint)]">
                        {total.units.toLocaleString()}
                        {it.unit}
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-right tabular-nums font-bold">
                  {Object.values(matrix).reduce((s, v) => s + (parseInt(v.boxes, 10) || 0), 0).toLocaleString()}박스
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="text-[13px] text-[var(--color-danger)] min-h-[20px]">{error}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[13.5px] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
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
