"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLineReceived } from "../actions";
import { todayISO } from "@/lib/format";

interface LocationOption {
  id: number;
  name: string;
}

interface ReceivedToggleProps {
  lineId: number;
  receivedDate: string | null;
  receivedLocationId: number | null;
  locations: ReadonlyArray<LocationOption>;
}

export default function ReceivedToggle({
  lineId,
  receivedDate,
  receivedLocationId,
  locations,
}: ReceivedToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dateValue, setDateValue] = useState<string>(receivedDate ?? "");
  const [locValue, setLocValue] = useState<number>(
    receivedLocationId ?? locations[0]?.id ?? 0
  );

  function save(newDate: string, newLocId: number | null) {
    setDateValue(newDate);
    if (newLocId !== null) setLocValue(newLocId);
    startTransition(async () => {
      await setLineReceived({
        vendorOrderLineId: lineId,
        receivedDate: newDate || null,
        receivedLocationId: newDate ? newLocId : null,
      });
      router.refresh();
    });
  }

  if (!dateValue) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => save(todayISO(), locValue || locations[0]?.id || null)}
        className="text-[12px] rounded-[6px] px-3 py-1.5 bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] hover:bg-[var(--color-border)] disabled:opacity-40"
      >
        오늘 입고 체크
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 justify-center flex-wrap">
      <input
        type="date"
        disabled={pending}
        value={dateValue}
        onChange={(e) => save(e.target.value, locValue || null)}
        className="text-[12px] rounded-[6px] px-2 py-1 border border-[var(--color-positive)] bg-[#e6f5ef] text-[var(--color-positive)] outline-none"
      />
      <select
        disabled={pending}
        value={locValue}
        onChange={(e) => save(dateValue, Number(e.target.value))}
        className="text-[12px] rounded-[6px] px-2 py-1 border border-[var(--color-positive)] bg-[#e6f5ef] text-[var(--color-positive)] outline-none font-semibold"
      >
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => save("", null)}
        className="text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-danger)] px-1"
        title="입고 취소"
      >
        ✕
      </button>
    </div>
  );
}
