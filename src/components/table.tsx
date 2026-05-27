import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  wrap?: boolean; // true면 cell이 줄바꿈됨 (default: nowrap)
}

interface DataTableProps<T> {
  columns: ReadonlyArray<Column<T>>;
  rows: ReadonlyArray<T>;
  rowKey: (row: T) => string | number;
  empty?: ReactNode;
}

export function DataTable<T>({ columns, rows, rowKey, empty }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={
                    "px-4 py-3 font-semibold text-[12px] uppercase tracking-wide text-[var(--color-ink-faint)] whitespace-nowrap " +
                    (c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                      ? "text-center"
                      : "text-left")
                  }
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[13px] text-[var(--color-ink-faint)]"
                >
                  {empty ?? "데이터가 없습니다."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={rowKey(r)}
                  className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)]"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={
                        "px-4 py-3 " +
                        (c.wrap ? "" : "whitespace-nowrap ") +
                        (c.align === "right"
                          ? "text-right tabular-nums"
                          : c.align === "center"
                          ? "text-center"
                          : "text-left")
                      }
                    >
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface BadgeProps {
  tone?: "default" | "positive" | "warning" | "danger" | "info";
  children: ReactNode;
}

export function Badge({ tone = "default", children }: BadgeProps) {
  const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
    default: "bg-[var(--color-surface-2)] text-[var(--color-ink-muted)]",
    positive: "bg-[#e6f5ef] text-[var(--color-positive)]",
    warning: "bg-[#fff4ea] text-[var(--color-warning)]",
    danger: "bg-[#fce9e9] text-[var(--color-danger)]",
    info: "bg-[#e8eefc] text-[var(--color-info)]",
  };
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-semibold " +
        toneClasses[tone]
      }
    >
      {children}
    </span>
  );
}
