"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type MemberAction = "fund" | "debit";

type Props = {
  disabled?: boolean;
  busy?: boolean;
  onAction: (action: MemberAction) => void;
};

/** Wallet fund/debit only — account status is managed via MemberAccountStatusControl. */
export function MemberActionsMenu({ disabled, busy, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const actions: { id: MemberAction; label: string }[] = [
    { id: "fund", label: "Fund" },
    { id: "debit", label: "Debit" }
  ];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || busy}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : null}
        Actions
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-raised)] py-1 shadow-[var(--shadow-md)]"
        >
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--gray-100)]"
              onClick={() => {
                setOpen(false);
                onAction(action.id);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
