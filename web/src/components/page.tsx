import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-[13px] text-[var(--color-ink-faint)]">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

interface SectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Section({ title, description, actions, children }: SectionProps) {
  return (
    <section className="px-8 py-6">
      {(title || actions) && (
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-faint)]">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
}

export function StatCard({ label, value, suffix }: StatCardProps) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="text-[12px] text-[var(--color-ink-faint)]">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-[28px] font-bold tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {suffix && (
          <span className="text-[13px] text-[var(--color-ink-faint)]">{suffix}</span>
        )}
      </div>
    </div>
  );
}
