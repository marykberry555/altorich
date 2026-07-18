"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ShieldCheck, Star, Users } from "lucide-react";
import {
  formatMembersCount,
  formatNairaCounter,
  formatPercentDisplay,
  transactedTodayValueAt,
  verifiedMembersValueAt,
  type HomepageStatsConfig
} from "@/lib/homepage/homepage-stats";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Props = {
  config: HomepageStatsConfig;
  className?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useCountUp(target: number, durationMs: number, enabled: boolean, decimals = 0) {
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const next = target * eased;
      setValue(decimals > 0 ? Number(next.toFixed(decimals)) : Math.round(next));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, enabled, decimals]);

  return value;
}

/** Platform scale & reliability — members + transacted climb every Lagos day. */
export function PlatformByTheNumbers({ config, className }: Props) {
  const membersRef = useRef<HTMLSpanElement>(null);
  const transactedRef = useRef<HTMLSpanElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const satisfaction = useCountUp(
    config.memberSatisfactionPercent,
    1400,
    visible && !reducedMotion,
    1
  );
  const availability = useCountUp(
    config.platformAvailabilityPercent,
    1400,
    visible && !reducedMotion,
    2
  );

  useEffect(() => {
    const paint = () => {
      const members = verifiedMembersValueAt(config);
      const transacted = transactedTodayValueAt(config);
      if (membersRef.current) {
        membersRef.current.textContent = formatMembersCount(members, config.verifiedMembersSuffix);
      }
      if (transactedRef.current) {
        transactedRef.current.textContent = `${formatNairaCounter(transacted)}${config.transactedTodaySuffix}`;
      }
    };

    paint();
    if (reducedMotion) return;

    const id = window.setInterval(paint, 1000);
    return () => window.clearInterval(id);
  }, [config, reducedMotion]);

  const cards = [
    {
      key: "members",
      icon: Users,
      valueNode: (
        <span ref={membersRef}>
          {formatMembersCount(verifiedMembersValueAt(config), config.verifiedMembersSuffix)}
        </span>
      ),
      label: config.verifiedMembersLabel,
      tone: "emerald" as const
    },
    {
      key: "transacted",
      icon: Activity,
      valueNode: (
        <span ref={transactedRef}>
          {formatNairaCounter(transactedTodayValueAt(config))}
          {config.transactedTodaySuffix}
        </span>
      ),
      label: config.transactedTodayLabel,
      tone: "gold" as const
    },
    {
      key: "satisfaction",
      icon: Star,
      value: formatPercentDisplay(satisfaction),
      label: config.memberSatisfactionLabel,
      tone: "gold" as const
    },
    {
      key: "availability",
      icon: ShieldCheck,
      value: formatPercentDisplay(availability),
      label: config.platformAvailabilityLabel,
      support: config.platformAvailabilitySupport,
      tone: "emerald" as const
    }
  ];

  return (
    <section
      ref={sectionRef}
      className={cn("section-pad bg-[var(--gray-50)]", className)}
      aria-labelledby="platform-numbers-heading"
    >
      <div className="container-ar">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            Trust signals
          </p>
          <h2
            id="platform-numbers-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl"
          >
            Platform by the numbers
          </h2>
          <p className="mt-2.5 text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            Scale, reliability, and member confidence — the signals that matter when growing wealth.
          </p>
        </div>

        <div className="mt-8 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.key}
                variant="elevated"
                padding="md"
                className="card-lift flex h-full min-w-0 flex-col items-start overflow-hidden"
              >
                <div
                  className={cn(
                    "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
                    card.tone === "gold"
                      ? "bg-[var(--gold-soft)] text-[var(--gold)]"
                      : "bg-[var(--emerald-soft)] text-[var(--emerald)]"
                  )}
                >
                  <Icon size={20} aria-hidden />
                </div>
                <p
                  className={cn(
                    "mt-5 w-full min-w-0 max-w-full break-words font-bold tabular-nums tracking-tight",
                    "text-[clamp(1.05rem,4.2vw,1.875rem)] leading-tight",
                    card.tone === "gold" ? "text-[var(--gold)]" : "text-[var(--heading)]"
                  )}
                >
                  {"valueNode" in card ? card.valueNode : card.value}
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">{card.label}</p>
                {"support" in card && card.support ? (
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-subtle)]">{card.support}</p>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
