"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SecureConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="secure-confirm-title"
      aria-describedby={description ? "secure-confirm-desc" : undefined}
    >
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onCancel} aria-label="Close dialog" />
      <div className="relative w-full max-w-md rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl">
        <h2 id="secure-confirm-title" className="text-lg font-semibold text-[var(--heading)]">
          {title}
        </h2>
        {description ? (
          <p id="secure-confirm-desc" className="mt-2 text-sm text-[var(--text-muted)]">
            {description}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant="primary"
            className={destructive ? "bg-red-600 hover:bg-red-500" : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
