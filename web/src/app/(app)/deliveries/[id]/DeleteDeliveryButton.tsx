"use client";

import { useTransition } from "react";
import { deleteDelivery } from "../actions";

export default function DeleteDeliveryButton({ deliveryId }: { deliveryId: number }) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("이 배송 기록을 삭제하시겠습니까?\n품목 라인이 함께 삭제됩니다.")) return;
    startTransition(async () => {
      await deleteDelivery(deliveryId);
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] px-4 py-2 text-[13px] text-[var(--color-danger)] hover:bg-[#fff5f5] disabled:opacity-40"
    >
      {pending ? "삭제 중..." : "삭제"}
    </button>
  );
}
