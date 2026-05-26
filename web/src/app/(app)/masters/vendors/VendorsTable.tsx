"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/table";
import { createVendor, updateVendor } from "../actions";

interface VendorData {
  id: number;
  name: string;
  category: string | null;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  account: string | null;
  active: boolean;
}

interface FormState {
  name: string;
  category: string;
  contactName: string;
  phone: string;
  address: string;
  account: string;
  active: boolean;
}

const emptyForm: FormState = {
  name: "",
  category: "",
  contactName: "",
  phone: "",
  address: "",
  account: "",
  active: true,
};

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-accent)]";

export default function VendorsTable({ rows }: { rows: ReadonlyArray<VendorData> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function startEdit(v: VendorData) {
    setEditingId(v.id);
    setShowAdd(false);
    setForm({
      name: v.name,
      category: v.category ?? "",
      contactName: v.contactName ?? "",
      phone: v.phone ?? "",
      address: v.address ?? "",
      account: v.account ?? "",
      active: v.active,
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
    if (!form.name.trim()) return setError("업체명을 입력하세요.");
    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      contactName: form.contactName.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      account: form.account.trim() || null,
      active: form.active,
    };
    startTransition(async () => {
      const res = editingId ? await updateVendor(editingId, payload) : await createVendor(payload);
      if (!res.success) return setError(res.error);
      cancel();
      router.refresh();
    });
  }
  function toggleActive(v: VendorData) {
    startTransition(async () => {
      await updateVendor(v.id, {
        name: v.name,
        category: v.category,
        contactName: v.contactName,
        phone: v.phone,
        address: v.address,
        account: v.account,
        active: !v.active,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-ink-faint)]">업체(공장) 마스터</p>
        {!showAdd && !editingId && (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90"
          >
            + 업체 추가
          </button>
        )}
      </div>
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">업체명</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">분류</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">담당자</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">연락처</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-faint)]">계좌</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink-faint)]">상태</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {showAdd && <EditRow form={form} setForm={setForm} error={error} pending={pending} onSave={save} onCancel={cancel} />}
              {rows.map((v) =>
                editingId === v.id ? (
                  <EditRow key={v.id} form={form} setForm={setForm} error={error} pending={pending} onSave={save} onCancel={cancel} />
                ) : (
                  <tr key={v.id} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="px-4 py-3 font-semibold">{v.name}</td>
                    <td className="px-4 py-3">{v.category ? <Badge>{v.category}</Badge> : "—"}</td>
                    <td className="px-4 py-3">{v.contactName ?? "—"}</td>
                    <td className="px-4 py-3 text-[12.5px] text-[var(--color-ink-muted)]">{v.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-[12px] text-[var(--color-ink-muted)]">{v.account ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <button type="button" onClick={() => toggleActive(v)} disabled={pending}>
                        {v.active ? <Badge tone="positive">사용중</Badge> : <Badge tone="danger">비활성</Badge>}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(v)}
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
      <td colSpan={7} className="px-4 py-4 whitespace-normal">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="업체명">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="분류">
            <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="예: 티슈" className={inputCls} />
          </Field>
          <Field label="담당자">
            <input type="text" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputCls} />
          </Field>
          <Field label="연락처">
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </Field>
          <Field label="주소">
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
          </Field>
          <Field label="계좌">
            <input type="text" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} placeholder="예: 신한은행 140-006-679580" className={inputCls} />
          </Field>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            사용중
          </label>
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
