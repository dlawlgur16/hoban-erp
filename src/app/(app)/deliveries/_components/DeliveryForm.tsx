"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDelivery, updateDelivery } from "../actions";
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
interface LocationOption {
  id: number;
  name: string;
}
interface StockEntry {
  key: string; // `${siteId}-${itemId}`
  ordered: number;
  delivered: number;
}

export interface DeliveryFormInitialValues {
  id: number;
  siteId: number;
  deliveryDate: string;
  deliveryTime: string | null;
  courier: string | null;
  clientContact: string | null;
  memo: string | null;
  fromLocationId: number | null;
  lines: ReadonlyArray<{ itemId: number; qtyBoxes: number }>;
}

interface DeliveryFormProps {
  mode: "create" | "edit";
  client: ClientInfo;
  initial?: DeliveryFormInitialValues;
  items: ReadonlyArray<ItemOption>;
  sites: ReadonlyArray<SiteOption>;
  locations: ReadonlyArray<LocationOption>;
  stockData: ReadonlyArray<StockEntry>; // 본인 라인 제외한 잔량 (수정 모드일 때)
}

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[13.5px] outline-none focus:border-[var(--color-accent)]";

export default function DeliveryForm({
  mode,
  client,
  initial,
  items,
  sites,
  locations,
  stockData,
}: DeliveryFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [siteId, setSiteId] = useState<number>(initial?.siteId ?? 0);
  const [fromLocationId, setFromLocationId] = useState<number>(
    initial?.fromLocationId ?? locations[0]?.id ?? 0
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(initial?.deliveryDate ?? todayISO());
  const [deliveryTime, setDeliveryTime] = useState<string>(initial?.deliveryTime ?? "");
  const [courier, setCourier] = useState<string>(initial?.courier ?? "");
  const [clientContact, setClientContact] = useState<string>(initial?.clientContact ?? "");
  const [memo, setMemo] = useState<string>(initial?.memo ?? "");
  const initialBoxes: Record<number, string> = {};
  if (initial) {
    for (const l of initial.lines) initialBoxes[l.itemId] = String(l.qtyBoxes);
  }
  const [boxesByItem, setBoxesByItem] = useState<Record<number, string>>(initialBoxes);

  const stockLookup = useMemo(() => {
    const map = new Map<string, { ordered: number; delivered: number }>();
    for (const e of stockData) map.set(e.key, { ordered: e.ordered, delivered: e.delivered });
    return map;
  }, [stockData]);

  function remaining(itemId: number): { ordered: number; delivered: number; remaining: number } {
    if (!siteId) return { ordered: 0, delivered: 0, remaining: 0 };
    const s = stockLookup.get(`${siteId}-${itemId}`) ?? { ordered: 0, delivered: 0 };
    return { ...s, remaining: s.ordered - s.delivered };
  }

  function submit() {
    setError(null);
    if (!siteId) return setError("사업소를 선택하세요.");
    if (!deliveryDate) return setError("배송일을 입력하세요.");

    type Line = { itemId: number; qtyBoxes: number; qtyUnits: number };
    const lines: Line[] = [];
    const overItems: string[] = [];
    for (const it of items) {
      const b = parseInt(boxesByItem[it.id] ?? "", 10);
      if (Number.isFinite(b) && b > 0) {
        const rem = remaining(it.id).remaining;
        if (b > rem) overItems.push(`${it.name} (잔여 ${rem}박스, 입력 ${b}박스)`);
        lines.push({ itemId: it.id, qtyBoxes: b, qtyUnits: b * it.unitsPerBox });
      }
    }
    if (lines.length === 0) return setError("수량을 하나 이상 입력하세요.");
    if (overItems.length > 0) return setError(`잔량 초과: ${overItems.join(" / ")}`);

    startTransition(async () => {
      const payload = {
        clientId: client.id,
        siteId,
        fromLocationId: fromLocationId || null,
        deliveryDate,
        deliveryTime: deliveryTime || null,
        courier: courier.trim() || null,
        clientContact: clientContact.trim() || null,
        memo: memo.trim() || null,
        lines,
      };
      const res =
        mode === "edit" && initial
          ? await updateDelivery({ ...payload, id: initial.id })
          : await createDelivery(payload);
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.push(mode === "edit" && initial ? `/deliveries/${initial.id}` : "/deliveries");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Field label="사업소">
            <select
              value={siteId}
              onChange={(e) => setSiteId(Number(e.target.value))}
              className={inputClass}
            >
              <option value={0}>선택하세요</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="출고 위치">
            <select
              value={fromLocationId}
              onChange={(e) => setFromLocationId(Number(e.target.value))}
              className={inputClass}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="배송일">
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="시간 (선택)">
            <input
              type="time"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="클라이언트 담당자 (선택)">
            <input
              type="text"
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
              placeholder="예: 안석현 프로님"
              className={inputClass}
            />
          </Field>
          <Field label="운송업체 (선택)">
            <input
              type="text"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              placeholder="예: 천지로지스"
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
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-[14px] font-bold">품목별 배송 수량</h3>
          <p className="text-[12px] text-[var(--color-ink-faint)] mt-1">
            {siteId
              ? "각 품목의 잔여 발주량(=발주−배송)이 표시됩니다. 박스 단위로 입력하세요."
              : "사업소를 먼저 선택하세요."}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">품목</th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">발주</th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">기존 배송</th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--color-positive)]">잔량</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink-faint)] w-[140px]">
                  배송 수량 (박스)
                </th>
                <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">개수</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const r = remaining(it.id);
                const boxesStr = boxesByItem[it.id] ?? "";
                const boxes = parseInt(boxesStr, 10) || 0;
                const units = boxes * it.unitsPerBox;
                const over = !!siteId && boxes > r.remaining;
                return (
                  <tr key={it.id} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-[11px] text-[var(--color-ink-faint)]">
                        박스당 {it.unitsPerBox.toLocaleString()}
                        {it.unit}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.ordered.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--color-ink-faint)]">
                      {r.delivered.toLocaleString()}
                    </td>
                    <td
                      className={
                        "px-4 py-3 text-right tabular-nums font-semibold " +
                        (r.remaining <= 0
                          ? "text-[var(--color-danger)]"
                          : "text-[var(--color-positive)]")
                      }
                    >
                      {r.remaining.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        disabled={!siteId}
                        value={boxesStr}
                        onChange={(e) =>
                          setBoxesByItem((m) => ({ ...m, [it.id]: e.target.value }))
                        }
                        placeholder="0"
                        className={
                          "w-24 px-2 py-1.5 rounded-[6px] border text-right tabular-nums text-[13px] outline-none disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-ink-faint)] " +
                          (over
                            ? "border-[var(--color-danger)] focus:border-[var(--color-danger)]"
                            : "border-[var(--color-border-strong)] focus:border-[var(--color-accent)]")
                        }
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
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="text-[13px] text-[var(--color-danger)] min-h-[20px]">{error}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              router.push(mode === "edit" && initial ? `/deliveries/${initial.id}` : "/deliveries")
            }
            className="px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[13.5px] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !siteId}
            className="px-6 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "저장 중..." : mode === "edit" ? "수정 저장" : "전체 저장"}
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
