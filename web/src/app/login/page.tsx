import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "로그인 · 호반/삼성 ERP" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight">판촉물 관리</h1>
          <p className="mt-2 text-sm text-[var(--color-ink-faint)]">
            젬스톤 관리자 전용
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
