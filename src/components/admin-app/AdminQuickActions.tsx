"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type AdminQuickAction =
  | "fund"
  | "debit"
  | "approve_deposit"
  | "reject_deposit"
  | "approve_withdrawal"
  | "reject_withdrawal"
  | "suspend"
  | "unsuspend"
  | "reset_pin"
  | "reset_password"
  | "disable_login"
  | "enable_login"
  | "assign_package"
  | "change_package";

const ACTIONS: { id: AdminQuickAction; label: string }[] = [
  { id: "fund", label: "Fund wallet" },
  { id: "debit", label: "Debit wallet" },
  { id: "approve_deposit", label: "Approve deposit" },
  { id: "reject_deposit", label: "Reject deposit" },
  { id: "approve_withdrawal", label: "Approve withdrawal" },
  { id: "reject_withdrawal", label: "Reject withdrawal" },
  { id: "suspend", label: "Suspend account" },
  { id: "unsuspend", label: "Unsuspend account" },
  { id: "reset_pin", label: "Reset PIN" },
  { id: "reset_password", label: "Reset password" },
  { id: "disable_login", label: "Disable login" },
  { id: "enable_login", label: "Enable login" },
  { id: "assign_package", label: "Assign package" },
  { id: "change_package", label: "Change package" }
];

type Props = {
  disabled?: boolean;
  busy?: boolean;
  onAction: (action: AdminQuickAction) => void;
  className?: string;
};

export function AdminQuickActions({ disabled, busy, onAction, className }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative inline-block text-left", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || busy}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="border-white/10 bg-white/5 text-zinc-100"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : null}
        Quick actions
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 max-h-80 min-w-[12rem] overflow-y-auto rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-2xl"
        >
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-zinc-100 hover:bg-white/5"
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
