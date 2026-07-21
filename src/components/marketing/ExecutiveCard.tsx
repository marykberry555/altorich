"use client";

import { useId, useState } from "react";
import { ChevronDown, MapPin, Quote } from "lucide-react";
import { LeadershipPortrait } from "@/components/marketing/LeadershipPortrait";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ExecutiveProfile } from "@/content/leadership";
import type { LeadershipImageSlug } from "@/lib/leadership-images";
import { cn } from "@/lib/utils";

type Props = {
  executive: ExecutiveProfile;
  defaultExpanded?: boolean;
};

export function ExecutiveCard({ executive, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const triggerId = useId();

  return (
    <Card
      variant="elevated"
      padding="none"
      className="overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-lg)]"
    >
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="relative p-5 pb-0 lg:p-6 lg:pb-6">
          <LeadershipPortrait
            slug={executive.imageSlug as LeadershipImageSlug}
            className="mx-auto max-w-[240px] lg:max-w-none"
            sizes="(max-width: 1024px) 240px, 280px"
          />
          {executive.isFounder ? (
            <Badge variant="gold" className="absolute left-8 top-8 lg:left-9 lg:top-9">
              Founder
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col p-5 pt-4 lg:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">{executive.title}</p>
          <h3 className="mt-1.5 text-2xl font-bold text-[var(--heading)]">{executive.name}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
            <MapPin size={14} className="shrink-0 text-[var(--emerald)]" aria-hidden />
            {executive.office}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">{executive.intro}</p>

          <button
            id={triggerId}
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded((v) => !v)}
            className="mt-5 inline-flex items-center gap-2 self-start rounded-[var(--radius)] px-3 py-2 text-sm font-semibold text-[var(--emerald)] transition hover:bg-[var(--emerald-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald)]"
          >
            {expanded ? "Show less" : "View full profile"}
            <ChevronDown
              size={16}
              aria-hidden
              className={cn("transition-transform duration-200", expanded && "rotate-180")}
            />
          </button>
        </div>
      </div>

      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        hidden={!expanded}
        className={cn(
          "border-t border-[var(--border)] bg-[var(--gray-50)] px-5 py-6 lg:px-6",
          !expanded && "hidden"
        )}
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--heading)]">Responsibilities</h4>
            <ul className="mt-3 space-y-2">
              {executive.responsibilities.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-[var(--text-muted)]">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--gold)]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--heading)]">
                Leadership philosophy
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{executive.leadershipPhilosophy}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--heading)]">
                Operational focus
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{executive.operationalFocus}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--heading)]">
              Strategic priorities
            </h4>
            <ul className="mt-3 space-y-2">
              {executive.strategicPriorities.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-[var(--text-muted)]">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--emerald)]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--heading)]">Role at Alto Rich</h4>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{executive.roleAtAltoRich}</p>
          </div>
        </div>

        <blockquote className="mt-8 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <Quote size={20} className="text-[var(--gold)]" aria-hidden />
          <p className="mt-3 text-base italic leading-relaxed text-[var(--heading)]">&ldquo;{executive.quote}&rdquo;</p>
          <footer className="mt-3 text-sm font-medium text-[var(--text-muted)]">— {executive.name}</footer>
        </blockquote>

        <p className="mt-5 text-sm leading-relaxed text-[var(--text-muted)]">{executive.message}</p>
      </div>
    </Card>
  );
}
