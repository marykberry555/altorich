"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatNairaCounter,
  formatNairaWithKobo,
  projectEarnings,
  wealthGrowthValueAt,
  type HomepageStatsConfig
} from "@/lib/homepage/homepage-stats";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/** Matches the brief’s live example (₦45,000 → Today ₦2,250). */
const CALCULATOR_DEFAULT = 45_000;

type Props = {
  config: HomepageStatsConfig;
  className?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function digitsOnly(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 12);
}

function withCommas(digits: string) {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toAmount(digits: string) {
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

function formatProjection(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return "₦0";
  return formatNairaCounter(amount);
}

/** Live wealth growth counter + earnings calculator — primary conversion block after hero. */
export function WealthGrowthExperience({ config, className }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [counterLabel, setCounterLabel] = useState(() =>
    formatNairaWithKobo(wealthGrowthValueAt(config))
  );
  const [amountDigits, setAmountDigits] = useState(() => String(CALCULATOR_DEFAULT));
  const valueRef = useRef<HTMLSpanElement>(null);
  const amount = toAmount(amountDigits);
  const displayValue = withCommas(amountDigits);

  const projection = projectEarnings(
    amount,
    config.calculatorDailyRatePercent,
    config.calculatorWeeklyRatePercent
  );

  const belowMin = amount > 0 && amount < config.calculatorMinInvestment;

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let raf = 0;
    let interval = 0;
    let lastLabel = "";

    const paint = () => {
      const label = formatNairaWithKobo(wealthGrowthValueAt(config));
      if (label === lastLabel) return false;
      lastLabel = label;
      setCounterLabel(label);
      if (valueRef.current) valueRef.current.textContent = label;
      return true;
    };

    paint();
    interval = window.setInterval(paint, reducedMotion ? 200 : 50);

    if (!reducedMotion) {
      const tick = () => {
        paint();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      window.clearInterval(interval);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [config, reducedMotion]);

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-[var(--border)] bg-[var(--gray-50)] section-pad",
        className
      )}
      aria-labelledby="wealth-growth-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_60%)]"
        aria-hidden
      />
      <div className="container-ar relative">
        <div className="mx-auto max-w-4xl px-2 text-center">
          <h2
            id="wealth-growth-heading"
            className="text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl"
          >
            {config.wealthGrowthHeadline}
          </h2>

          <p
            className={cn(
              "mt-8 w-full font-extrabold tabular-nums tracking-tight text-[var(--emerald)]",
              "text-[clamp(2.5rem,9vw,4.25rem)] leading-none",
              "drop-shadow-[0_0_28px_rgba(16,185,129,0.35)]"
            )}
            aria-live="off"
          >
            <span ref={valueRef}>{counterLabel}</span>
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-md)] sm:p-8">
          <h3 className="text-center text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">
            {config.calculatorTitle}
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-[var(--text-muted)]">
            Enter your intended investment amount to instantly preview your projected earnings.
          </p>

          <label className="mx-auto mt-6 block max-w-md">
            <span className="mb-2 block text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Investment Amount (₦)
            </span>
            <div
              className={cn(
                "flex h-14 w-full items-center justify-center gap-1 rounded-[var(--radius)]",
                "border border-[var(--border-strong)] bg-[var(--surface)] px-4 shadow-[var(--shadow-sm)]",
                "transition focus-within:border-[var(--emerald)] focus-within:ring-2 focus-within:ring-[var(--emerald)]/25"
              )}
            >
              <span className="shrink-0 select-none text-lg font-semibold text-[var(--text-muted)]" aria-hidden>
                ₦
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={displayValue}
                onChange={(e) => setAmountDigits(digitsOnly(e.target.value))}
                placeholder="45,000"
                style={{ width: `${Math.max((displayValue || "45,000").length, 1) + 1}ch` }}
                className={cn(
                  "max-w-[min(100%,18ch)] bg-transparent text-center text-lg font-semibold tabular-nums text-[var(--heading)]",
                  "placeholder:text-[var(--text-subtle)] outline-none"
                )}
                aria-invalid={belowMin || undefined}
              />
            </div>
            {belowMin ? (
              <span className="mt-2 block text-center text-xs text-[var(--text-subtle)]">
                Minimum ₦{withCommas(String(config.calculatorMinInvestment))}
              </span>
            ) : null}
          </label>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
            <ResultCard label="Today's Earnings" value={formatProjection(projection.today)} />
            <ResultCard label="Weekly Earnings" value={formatProjection(projection.weekly)} />
            <ResultCard label="Monthly Projection" value={formatProjection(projection.monthly)} />
            <ResultCard label="Annual Projection" value={formatProjection(projection.annual)} />
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-[var(--text-subtle)]">
            Illustrative projections based on Alto Rich&apos;s current Platform Earning Model.
          </p>
        </div>
      </div>
    </section>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="elevated" padding="sm" className="text-center transition-shadow duration-200">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
        {label}
      </p>
      <p
        key={value}
        className="mt-1.5 animate-fade-in text-xl font-bold tabular-nums tracking-tight text-[var(--emerald)] sm:text-2xl"
      >
        {value}
      </p>
    </Card>
  );
}
