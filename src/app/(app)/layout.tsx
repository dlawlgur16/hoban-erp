import Link from "next/link";
import Sidebar from "./Sidebar";
import { getAllClients, getCurrentClient } from "@/lib/clientContext";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [allClients, current] = await Promise.all([getAllClients(), getCurrentClient()]);

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <Link href="/" className="block">
            <div className="text-[13px] font-semibold tracking-wide text-[var(--color-ink-faint)]">
              ZEMSTONE
            </div>
            <div className="mt-1 text-[15px] font-bold">판촉물 관리</div>
          </Link>
        </div>
        <Sidebar
          clients={allClients.map((c) => ({ id: c.id, code: c.code, name: c.name }))}
          currentCode={current.code}
        />
        <div className="px-6 py-4 border-t border-[var(--color-border)] text-[12px] text-[var(--color-ink-faint)]">
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="hover:text-[var(--color-ink)]">
              로그아웃
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
