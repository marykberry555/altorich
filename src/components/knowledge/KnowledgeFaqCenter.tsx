"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ_CATEGORY_LABELS, searchFaq } from "@/content/knowledge/faq";
import type { FaqCategorySlug } from "@/content/knowledge/types";

type Props = {
  showSearch?: boolean;
};

const FAQ_CATEGORIES: Array<FaqCategorySlug | "all"> = [
  "all",
  "account",
  "deposits",
  "withdrawals",
  "investments",
  "welcome-bonus",
  "referrals",
  "security",
  "technical"
];

export function KnowledgeFaqCenter({ showSearch = true }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategorySlug | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const results = useMemo(() => searchFaq(query, category), [query, category]);

  return (
    <div className="space-y-6">
      {showSearch ? (
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search frequently asked questions…"
            aria-label="Search FAQ"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3.5 text-sm focus:border-[var(--emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--emerald)]/20"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="FAQ categories">
        {FAQ_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={category === cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              category === cat
                ? "border-[var(--emerald)] bg-[var(--emerald)]/10 text-[var(--emerald)]"
                : "border-[var(--border)] text-[var(--text-muted)]"
            )}
          >
            {cat === "all" ? "All" : FAQ_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="space-y-3" aria-live="polite">
        {results.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">No matching questions. Try a different search term.</p>
        ) : (
          results.map((item) => {
            const open = openId === item.id;
            return (
              <div key={item.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenId(open ? null : item.id)}
                  aria-expanded={open}
                >
                  <span className="font-semibold text-[var(--heading)]">{item.question}</span>
                  <ChevronDown
                    size={18}
                    className={cn("mt-0.5 shrink-0 text-[var(--text-subtle)] transition", open && "rotate-180")}
                    aria-hidden
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-200 ease-out",
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-[var(--border)] px-5 pb-4 pt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
