"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/table";
import { createSite, updateSite } from "../actions";

interface SiteData {
  id: number;
  clientId: number;
  name: string;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  active: boolean;
}

interface SitesTableProps {
  clientId: number;
  clientName: string;
  rows: ReadonlyArray<SiteData>;
}

interface FormState {
  name: string;
  address: string;
  contactName: string;
  contactPhone: string;
  active: boolean;
}

const emptyForm: FormState = {
  name: "",
  address: "",
  contactName: "",
  contactPhone: "",
  active: true,
};

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-accent)]";

export default function SitesTable({ clientId, clientName, rows }: SitesTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function startEdit(s: SiteData) {
    setEditingId(s.id);
    setShowAdd(false);
    setForm({
      name: s.name,
      address: s.address ?? "",
      contactName: s.contactName ?? "",
      contactPhone: s.contactPhone ?? "",
      active: s.active,
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
    setForm(emptyForm);
    setError(null);
  }

  function save() {
    setError(null);
    if (!form.name.trim()) {
      setError("사업소명을 입력하세요.");
      return;
    }
    const payload = {
      clientId,
      name: form.name.trim(),
      address: form.address.trim() || null,
      contactName: form.contactName.trim() || null,
      contactPhone: form.contactPhone.trim() || null,
      active: form.active,
    };
    startTransition(async () => {
      const res = editingId
        ? await updateSite(editingId, payload)
        : await createSite(payload);
      if (!res.success) {
        setError(res.error);
        return;
      }
      cancel();
      router.refresh();
    });
  }

  function toggleActive(s: SiteData) {
    startTransition(async () => {
      await updateSite(s.id, {
        clientId: s.clientId,
        name: s.name,
        address: s.address,
        contactName: s.contactName,
        contactPhone: s.contactPhone,
        active: !s.active,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-ink-faint)]">
          {clientName} 사업소 마스터 — 추가/수정/비활성 가능
        </p>
        {!showAdd && !editingId && (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90"
          >
            + 사업소 추가
          </button>
        )}
      </div>

      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">사업소명</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">주소</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">담당자</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">연락처</th>
              <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink-faint)]">상태</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {showAdd && <EditRow form={form} setForm={setForm} error={error} pending={pending} onSave={save} onCancel={cancel} />}
            {rows.map((s) =>
              editingId === s.id ? (
                <EditRow
                  key={s.id}
                  form={form}
                  setForm={setForm}
                  error={error}
                  pending={pending}
                  onSave={save}
                  onCancel={cancel}
                />
              ) : (
                <tr key={s.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-4 py-3 font-semibold">{s.name}</td>
                  <td className="px-4 py-3 text-[12.5px] text-[var(--color-ink-muted)]">
                    {s.address ?? "—"}
                  </td>
                  <td className="px-4 py-3">{s.contactName ?? "—"}</td>
                  <td className="px-4 py-3 text-[12.5px] text-[var(--color-ink-muted)]">
                    {s.contactPhone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(s)}
                      disabled={pending}
                      className="cursor-pointer"
                    >
                      {s.active ? <Badge tone="positive">사용중</Badge> : <Badge tone="danger">비활성</Badge>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
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
          <Field label="사업소명">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예: 강남"
              className={inputCls}
            />
          </Field>
          <Field label="주소">
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="담당자">
            <input
              type="text"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="연락처">
            <input
              type="text"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
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
      <span className="block text-[11px] font-semibold text-[var(--color-ink-faint)] mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
