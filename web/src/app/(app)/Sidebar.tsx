"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { switchClient } from "./switchClient";

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: ReadonlyArray<NavItem> };

const NAV_GROUPS: ReadonlyArray<NavGroup> = [
  {
    label: "업무",
    items: [
      { href: "/", label: "대시보드" },
      { href: "/orders", label: "발주 관리" },
      { href: "/vendor-orders", label: "업체 발주" },
      { href: "/deliveries", label: "입고/배송" },
      { href: "/stock", label: "재고" },
    ],
  },
  {
    label: "정산",
    items: [
      { href: "/billing/payments", label: "업체 지불" },
      { href: "/billing/receipts", label: "클라이언트 입금" },
    ],
  },
  {
    label: "마스터",
    items: [
      { href: "/masters/clients", label: "클라이언트" },
      { href: "/masters/sites", label: "사업소" },
      { href: "/masters/items", label: "품목" },
      { href: "/masters/vendors", label: "업체" },
      { href: "/masters/locations", label: "보관위치" },
    ],
  },
];

interface ClientOption {
  id: number;
  code: string;
  name: string;
}

interface SidebarProps {
  clients: ReadonlyArray<ClientOption>;
  currentCode: string;
}

export default function Sidebar({ clients, currentCode }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSwitch(code: string) {
    if (code === currentCode) return;
    startTransition(async () => {
      await switchClient(code);
      router.refresh();
    });
  }

  return (
    <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
      <div className="mx-3 mb-1">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)] mb-1.5">
          현재 클라이언트
        </div>
        <div className="relative">
          <select
            value={currentCode}
            disabled={pending}
            onChange={(e) => onSwitch(e.target.value)}
            className="w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-3 pr-9 py-2.5 text-[14px] font-bold text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] cursor-pointer disabled:opacity-50"
          >
            {clients.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-ink-faint)]">
            ▼
          </span>
        </div>
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
            {group.label}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      "block rounded-[8px] px-3 py-2 text-[13.5px] transition " +
                      (active
                        ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-semibold"
                        : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]")
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
