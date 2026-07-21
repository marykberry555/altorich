"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Lightbulb, Shield, UserCheck, Wallet, X } from "lucide-react";
import type { Recommendation } from "@/lib/member-experience/types";
import { cn } from "@/lib/utils";

type Props = {
  recommendations: Recommendation[];
  className?: string;
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

function recIcon(rec: Recommendation) {
  const text = `${rec.title} ${rec.body}`.toLowerCase();
  if (text.includes("profile") || text.includes("verify")) return UserCheck;
  if (text.includes("fund") || text.includes("wallet")) return Wallet;
  if (text.includes("security")) return Shield;
  if (text.includes("knowledge") || text.includes("guide")) return BookOpen;
  return Lightbulb;
}

export function SmartRecommendationsPanel({ recommendations, className }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () =>
      recommendations
        .filter((r) => !dismissed.has(r.id))
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        .slice(0, 3),
    [recommendations, dismissed]
  );

  if (visible.length === 0) return null;

  return (
    <section className={cn("space-y-2", className)} aria-label="Recommendations">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">For you</p>
      <ul className="space-y-2">
        {visible.map((rec) => {
          const Icon = recIcon(rec);
          return (
            <li key={rec.id}>
              <Link
                href={rec.href}
                className="group flex items-start gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition hover:border-[var(--emerald)]/30 hover:bg-[var(--emerald)]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald)]"
              >
                <Icon size={18} className="mt-0.5 shrink-0 text-[var(--emerald)]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--heading)]">{rec.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">{rec.body}</p>
                </div>
                {rec.dismissible ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDismissed((prev) => new Set(prev).add(rec.id));
                    }}
                    className="shrink-0 rounded-md p-1 text-[var(--text-subtle)] opacity-0 transition hover:bg-black/5 hover:text-[var(--heading)] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald)]"
                    aria-label={`Dismiss ${rec.title}`}
                  >
                    <X size={16} aria-hidden />
                  </button>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
