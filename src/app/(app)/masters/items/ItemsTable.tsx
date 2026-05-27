"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/table";
import { createItem, updateItem } from "../actions";

interface ItemData {
  id: number;
  name: string;
  category: string | null;
  unit: string;
  unitsPerBox: number;
  active: boolean;
}

interface ItemsTableProps {
  rows: ReadonlyArray<ItemData>;
}

interface FormState {
  name: string;
  category: string;
  unit: string;
  unitsPerBox: string;
  active: boolean;
}

const emptyForm: FormState = { name: "", category: "", unit: "개", unitsPerBox: "1", active: true };
const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-accent)]";

export default function ItemsTable({ rows }: ItemsTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function startEdit(it: ItemData) {
    setEditingId(it.id);
    setShowAdd(false);
    setForm({
      name: it.name,
      category: it.category ?? "",
      unit: it.unit,
      unitsPerBox: String(it.unitsPerBox),
      active: it.active,
    });
    setError(null);
  }
  function startAdd() {
    setShowAdd(true);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }
  function cancel() {
    setShowAdd(false);
    setEditingId(null);
    setError(null);
  }
  function save() {
    setError(null);
    if (!form.name.trim()) return setError("품목명을 입력하세요.");
    const upb = parseInt(form.unitsPerBox, 10);
    if (!Number.isFinite(upb) || upb <= 0) return setError("박스당 수량은 1 이상의 정수.");
    if (!form.unit.trim()) return setError("단위를 입력하세요.");
    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      unit: form.unit.trim(),
      unitsPerBox: upb,
      active: form.active,
    };
    startTransition(async () => {
      const res = editingId ? await updateItem(editingId, payload) : await createItem(payload);
      if (!res.success) return setError(res.error);
      cancel();
      router.refresh();
    });
  }
  function toggleActive(it: ItemData) {
    startTransition(async () => {
      await updateItem(it.id, {
        name: it.name,
        category: it.category,
        unit: it.unit,
        unitsPerBox: it.unitsPerBox,
        active: !it.active,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-ink-faint)]">품목 마스터 — 추가/수정/비활성</p>
        {!showAdd && !editingId && (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90"
          >
            + 품목 추가
          </button>
        )}
      </div>
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">품목명</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">분류</th>
              <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink-faint)]">단위</th>
              <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-faint)]">박스당</th>
              <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink-faint)]">상태</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {showAdd && <EditRow form={form} setForm={setForm} error={error} pending={pending} onSave={save} onCancel={cancel} />}
            {rows.map((it) =>
              editingId === it.id ? (
                <EditRow key={it.id} form={form} setForm={setForm} error={error} pending={pending} onSave={save} onCancel={cancel} />
              ) : (
                <tr key={it.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-4 py-3 font-semibold">{it.name}</td>
                  <td className="px-4 py-3">
                    {it.category ? <Badge>{it.category}</Badge> : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">{it.unit}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {it.unitsPerBox.toLocaleString()}
                    {it.unit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button type="button" onClick={() => toggleActive(it)} disabled={pending}>
                      {it.active ? <Badge tone="positive">사용중</Badge> : <Badge tone="danger">비활성</Badge>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(it)}
                      disabled={pending}
                      className="text-[12px] text-[var(--color-info)] hover:underline"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditRow({
  form,
  setForm,
  error,
  pending,
  onSave,
  onCancel,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  error: string | null;
  pending: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <tr className="border-b border-[var(--color-border)] last:border-b-0 bg-[var(--color-surface-2)]">
      <td colSpan={6} className="px-4 py-4 whitespace-normal">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="품목명">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예: 미용티슈"
              className={inputCls}
            />
          </Field>
          <Field label="분류">
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="예: 티슈"
              className={inputCls}
            />
          </Field>
          <Field label="단위">
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="개"
              className={inputCls}
            />
          </Field>
          <Field label="박스당 수량">
            <input
              type="number"
              value={form.unitsPerBox}
              onChange={(e) => setForm({ ...form, unitsPerBox: e.target.value })}
              min={1}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            사용중
          </label>
        </div>
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="text-[13px] text-[var(--color-danger)] min-h-[20px]">{error}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[12.5px] text-[var(--color-ink-muted)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              className="px-5 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-[12.5px] font-semibold disabled:opacity-40"
            >
              {pending ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-[var(--color-ink-faint)] mb-1">{label}</span>
      {children}
    </label>
  );
}
