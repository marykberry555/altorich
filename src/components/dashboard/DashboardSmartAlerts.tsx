"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  CheckCircle2,
  Gift,
  Info,
  ShieldAlert,
  UserCheck,
  X
} from "lucide-react";
import type { SmartAlert } from "@/lib/dashboard/smart-alerts";
import { cn } from "@/lib/utils";

type Props = {
  alerts: SmartAlert[];
  className?: string;
};

const PRIORITY_ORDER = { critical: 0, important: 1, informational: 2 } as const;

const priorityStyles = {
  critical: "border-red-200/80 bg-red-50/90 dark:border-red-500/30 dark:bg-red-500/10",
  important: "border-[var(--gold)]/30 bg-[var(--gold-soft)]/80",
  informational: "border-[var(--border)] bg-[var(--gray-50)]/80"
};

function alertIcon(alert: SmartAlert) {
  const text = `${alert.title} ${alert.body}`.toLowerCase();
  if (text.includes("kyc") || text.includes("profile") || text.includes("verify")) return UserCheck;
  if (text.includes("withdrawal") || text.includes("withdraw")) return ArrowUpFromLine;
  if (text.includes("deposit") || text.includes("fund")) return ArrowDownToLine;
  if (text.includes("bonus") || text.includes("reward")) return Gift;
  if (text.includes("settlement") || text.includes("monday")) return Bell;
  if (text.includes("referral")) return CheckCircle2;
  if (alert.priority === "critical") return ShieldAlert;
  if (alert.priority === "important") return AlertTriangle;
  return Info;
}

export function DashboardSmartAlerts({ alerts, className }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () =>
      alerts
        .filter((a) => !dismissed.has(a.id))
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        .slice(0, 4),
    [alerts, dismissed]
  );

  if (visible.length === 0) return null;

  return (
    <section className={cn("space-y-3", className)} aria-label="Smart alerts">
      {visible.map((alert) => {
        const Icon = alertIcon(alert);
        const content = (
          <div
            className={cn(
              "flex items-start gap-3 rounded-[var(--radius)] border px-4 py-3.5 transition",
              priorityStyles[alert.priority]
            )}
          >
            <Icon
              size={18}
              className={cn(
                "mt-0.5 shrink-0",
                alert.priority === "critical" && "text-red-600",
                alert.priority === "important" && "text-[var(--gold)]",
                alert.priority === "informational" && "text-[var(--emerald)]"
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--heading)]">{alert.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-muted)]">{alert.body}</p>
            </div>
            {alert.dismissible ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDismissed((prev) => new Set(prev).add(alert.id));
                }}
                className="shrink-0 rounded-md p-1 text-[var(--text-subtle)] transition hover:bg-black/5 hover:text-[var(--heading)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald)]"
                aria-label={`Dismiss ${alert.title}`}
              >
                <X size={16} aria-hidden />
              </button>
            ) : null}
          </div>
        );

        return alert.href ? (
          <Link key={alert.id} href={alert.href} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald)] rounded-[var(--radius)]">
            {content}
          </Link>
        ) : (
          <div key={alert.id}>{content}</div>
        );
      })}
    </section>
  );
}
