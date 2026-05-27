"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      const from = searchParams.get("from") || "/";
      router.replace(from);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="sr-only">비밀번호</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 입력"
          autoComplete="current-password"
          autoFocus
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-base text-center tracking-widest outline-none focus:border-[var(--color-accent)]"
        />
      </label>
      <button
        type="submit"
        disabled={pending || !password}
        className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] py-3 text-sm font-semibold text-[var(--color-accent-fg)] transition hover:opacity-90 disabled:opacity-40"
      >
        {pending ? "확인 중..." : "로그인"}
      </button>
      {error && (
        <p className="pt-1 text-center text-[13px] text-[var(--color-danger)]">{error}</p>
      )}
    </form>
  );
}
