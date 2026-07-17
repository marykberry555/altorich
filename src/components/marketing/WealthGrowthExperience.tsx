"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatNairaCounter,
  projectEarnings,
  wealthGrowthValueAt,
  type HomepageStatsConfig
} from "@/lib/homepage/homepage-stats";
import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";
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

function parseInvestmentInput(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number(digits);
}

function formatInputDisplay(amount: number) {
  if (!amount) return "";
  return amount.toLocaleString("en-NG");
}

function useAnimatedNaira(target: number, reducedMotion: boolean) {
  const [display, setDisplay] = useState(target);
  const currentRef = useRef(target);

  useEffect(() => {
    if (reducedMotion) {
      currentRef.current = target;
      setDisplay(target);
      return;
    }

    let raf = 0;
    const tick = () => {
      const current = currentRef.current;
      const delta = target - current;
      if (Math.abs(delta) < 1) {
        currentRef.current = target;
        setDisplay(target);
        return;
      }
      const next = current + delta * 0.18;
      currentRef.current = next;
      setDisplay(Math.round(next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reducedMotion]);

  return display;
}

/** Live wealth growth counter + interactive Platform Earning Model calculator. */
export function WealthGrowthExperience({ config, className }: Props) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [staticLabel, setStaticLabel] = useState(() =>
    formatNairaCounter(wealthGrowthValueAt(config))
  );
  const [inputRaw, setInputRaw] = useState("");
  const principal = parseInvestmentInput(inputRaw);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setStaticLabel(formatNairaCounter(wealthGrowthValueAt(config)));
      return;
    }

    let raf = 0;
    let lastShown = -1;

    const tick = () => {
      const value = wealthGrowthValueAt(config);
      if (value !== lastShown && valueRef.current) {
        lastShown = value;
        valueRef.current.textContent = formatNairaCounter(value);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [config, reducedMotion]);

  const projection = useMemo(
    () =>
      projectEarnings(
        principal,
        config.calculatorDailyRatePercent,
        config.calculatorWeeklyRatePercent
      ),
    [principal, config.calculatorDailyRatePercent, config.calculatorWeeklyRatePercent]
  );

  const belowMin = principal > 0 && principal < config.calculatorMinInvestment;
  const todayAnim = useAnimatedNaira(projection.today, reducedMotion);
  const weeklyAnim = useAnimatedNaira(projection.weekly, reducedMotion);
  const monthlyAnim = useAnimatedNaira(projection.monthly, reducedMotion);
  const annualAnim = useAnimatedNaira(projection.annual, reducedMotion);
  const principalAnim = useAnimatedNaira(projection.principal, reducedMotion);

  return (
    <section
      className={cn(
        "relative overflow-hidden border-y border-[var(--border)] bg-[var(--gray-50)] section-pad",
        className
      )}
      aria-labelledby="wealth-growth-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,168,83,0.14),transparent_60%)]"
        aria-hidden
      />
      <div className="container-ar relative">
        {/* Feature 1 — Live wealth growth */}
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="wealth-growth-heading"
            className="text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl lg:text-[2.75rem]"
          >
            {config.wealthGrowthHeadline}
          </h2>
          <div
            className={cn(
              "relative mt-8 rounded-[var(--radius-lg)] border border-[var(--border-float)] bg-[var(--surface-raised)] px-6 py-10 shadow-[var(--shadow-md)]",
              "sm:px-10 sm:py-12"
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] shadow-[0_0_60px_rgba(212,168,83,0.14)]"
              aria-hidden
            />
            <p
              className={cn(
                "font-bold tracking-tight text-[var(--gold)]",
                "text-[clamp(2.75rem,9vw,4.75rem)] leading-none",
                "drop-shadow-[0_0_28px_rgba(212,168,83,0.4)]"
              )}
              aria-live="off"
            >
              <span ref={valueRef}>{staticLabel}</span>
            </p>
            <p className="mt-5 text-sm text-[var(--text-muted)]">{config.wealthGrowthSupport}</p>
          </div>
        </div>

        {/* Feature 2 — Earnings calculator */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Earnings preview
            </p>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">
              {config.calculatorTitle}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
              {config.calculatorDescription}
            </p>
          </div>

          <label className="mx-auto mt-8 block max-w-xl">
            <span className="text-sm font-medium text-[var(--text)]">Investment Amount (₦)</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={`Enter amount (Minimum ₦${config.calculatorMinInvestment.toLocaleString("en-NG")})`}
              value={formatInputDisplay(principal)}
              onChange={(e) => setInputRaw(e.target.value)}
              className={cn(
                "mt-2 h-14 w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface-raised)]",
                "px-4 text-lg font-semibold text-[var(--heading)] shadow-[var(--shadow-sm)]",
                "outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/25"
              )}
              aria-describedby="calculator-hint"
            />
            <span id="calculator-hint" className="mt-2 block text-xs text-[var(--text-subtle)]">
              {belowMin
                ? `Minimum investment is ₦${config.calculatorMinInvestment.toLocaleString("en-NG")}.`
                : "Calculations update instantly as you type."}
            </span>
          </label>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ResultCard label="Current Investment" value={formatNairaCounter(principalAnim)} accent="heading" />
            <ResultCard label="Today's Earnings" value={formatNairaCounter(todayAnim)} accent="gold" />
            <ResultCard label="Weekly Earnings" value={formatNairaCounter(weeklyAnim)} accent="emerald" />
            <ResultCard label="Monthly Projection" value={formatNairaCounter(monthlyAnim)} accent="gold" />
            <ResultCard label="Annual Projection" value={formatNairaCounter(annualAnim)} accent="emerald" />
            <ResultCard
              label="Platform Earning Model"
              value={`${config.calculatorDailyRatePercent}% daily · ${config.calculatorWeeklyRatePercent}% weekly`}
              accent="heading"
              small
            />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-[var(--text-subtle)]">
            {config.calculatorDisclaimer} Powered by Alto Rich&apos;s {PLATFORM_EARNING.modelName}.
          </p>
        </div>
      </div>
    </section>
  );
}

function ResultCard({
  label,
  value,
  accent,
  small
}: {
  label: string;
  value: string;
  accent: "gold" | "emerald" | "heading";
  small?: boolean;
}) {
  const color =
    accent === "gold"
      ? "text-[var(--gold)]"
      : accent === "emerald"
        ? "text-[var(--emerald)]"
        : "text-[var(--heading)]";

  return (
    <Card variant="elevated" className="card-lift h-full">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
        {label}
      </p>
      <p className={cn("mt-2 font-bold tracking-tight", color, small ? "text-base leading-snug" : "text-2xl sm:text-[1.65rem]")}>
        {value}
      </p>
    </Card>
  );
}
