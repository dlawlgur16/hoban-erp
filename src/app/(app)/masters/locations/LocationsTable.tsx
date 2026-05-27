"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/table";
import { createLocation, updateLocation } from "../actions";

type Kind = "warehouse" | "onsite" | "vendor";

interface LocationData {
  id: number;
  name: string;
  kind: string;
  active: boolean;
}

const KIND_LABEL: Record<Kind, string> = {
  warehouse: "창고(외부)",
  onsite: "사내 보관",
  vendor: "업체 보관",
};

interface FormState {
  name: string;
  kind: Kind;
  active: boolean;
}

const emptyForm: FormState = { name: "", kind: "warehouse", active: true };
const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-accent)]";

export default function LocationsTable({ rows }: { rows: ReadonlyArray<LocationData> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function startEdit(l: LocationData) {
    setEditingId(l.id);
    setShowAdd(false);
    setForm({ name: l.name, kind: (l.kind as Kind) ?? "warehouse", active: l.active });
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
    if (!form.name.trim()) return setError("위치명을 입력하세요.");
    const payload = { name: form.name.trim(), kind: form.kind, active: form.active };
    startTransition(async () => {
      const res = editingId ? await updateLocation(editingId, payload) : await createLocation(payload);
      if (!res.success) return setError(res.error);
      cancel();
      router.refresh();
    });
  }
  function toggleActive(l: LocationData) {
    startTransition(async () => {
      await updateLocation(l.id, {
        name: l.name,
        kind: (l.kind as Kind) ?? "warehouse",
        active: !l.active,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-ink-faint)]">보관위치 마스터</p>
        {!showAdd && !editingId && (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90"
          >
            + 위치 추가
          </button>
        )}
      </div>
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">위치명</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">유형</th>
              <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink-faint)]">상태</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {showAdd && <EditRow form={form} setForm={setForm} error={error} pending={pending} onSave={save} onCancel={cancel} />}
            {rows.map((l) =>
              editingId === l.id ? (
                <EditRow key={l.id} form={form} setForm={setForm} error={error} pending={pending} onSave={save} onCancel={cancel} />
              ) : (
                <tr key={l.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-4 py-3 font-semibold">{l.name}</td>
                  <td className="px-4 py-3">
                    <Badge tone="info">{KIND_LABEL[l.kind as Kind] ?? l.kind}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button type="button" onClick={() => toggleActive(l)} disabled={pending}>
                      {l.active ? <Badge tone="positive">사용중</Badge> : <Badge tone="danger">비활성</Badge>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(l)}
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
      <td colSpan={4} className="px-4 py-4 whitespace-normal">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="위치명">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예: 천지로지스"
              className={inputCls}
            />
          </Field>
          <Field label="유형">
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}
              className={inputCls}
            >
              <option value="warehouse">창고(외부)</option>
              <option value="onsite">사내 보관</option>
              <option value="vendor">업체 보관</option>
            </select>
          </Field>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-[12.5px] cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              사용중
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="text-[13px] text-[var(--color-danger)] min-h-[20px]">{error}</div>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} disabled={pending} className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[12.5px] text-[var(--color-ink-muted)]">취소</button>
            <button type="button" onClick={onSave} disabled={pending} className="px-5 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-[12.5px] font-semibold disabled:opacity-40">
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
