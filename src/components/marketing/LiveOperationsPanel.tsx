"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { PACKAGE_CONFIG } from "@/lib/packages/package-config";
import type { HomepageStatsConfig } from "@/lib/homepage/homepage-stats";
import { cn } from "@/lib/utils";

type Props = {
  config: HomepageStatsConfig;
  className?: string;
};

const POINT_COUNT = 64;
const VIEW_W = 800;
const VIEW_H = 280;
const PAD_X = 20;
const PAD_Y = 36;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Smooth, clearly rising operational series — visible fluctuations, not a flat line. */
function buildSeries(baseline: number, fluctuation: number, t: number) {
  const values: number[] = [];
  const amp = Math.max(0.06, fluctuation * 1.8);
  for (let i = 0; i < POINT_COUNT; i++) {
    const progress = i / (POINT_COUNT - 1);
    // Stronger rise so the chart reads as growth at a glance
    const trend = 0.18 + baseline * 0.35 + progress * 0.55;
    const wave =
      Math.sin(progress * 8.5 + t * 1.4) * amp +
      Math.sin(progress * 3.1 + t * 0.7 + 1.1) * amp * 0.55 +
      Math.sin(progress * 14 + t * 2.1) * amp * 0.18;
    values.push(Math.min(0.92, Math.max(0.08, trend + wave)));
  }
  return values;
}

function seriesToPath(values: number[]) {
  const usableW = VIEW_W - PAD_X * 2;
  const usableH = VIEW_H - PAD_Y * 2;

  const coords = values.map((v, i) => ({
    x: PAD_X + (i / (values.length - 1)) * usableW,
    y: PAD_Y + (1 - v) * usableH
  }));

  let line = `M ${coords[0]!.x.toFixed(1)} ${coords[0]!.y.toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    const p = coords[i]!;
    line += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }

  const last = coords[coords.length - 1]!;
  const first = coords[0]!;
  const area = `${line} L ${last.x.toFixed(1)} ${(VIEW_H - PAD_Y).toFixed(1)} L ${first.x.toFixed(1)} ${(VIEW_H - PAD_Y).toFixed(1)} Z`;

  return { line, area, tip: last };
}

/**
 * Soft operational activity visualization — upward trend with gentle fluctuations.
 * SVG-based so it never collapses to a blank box.
 */
export function LiveOperationsPanel({ config, className }: Props) {
  const gradientId = useId().replace(/:/g, "");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [path, setPath] = useState(() =>
    seriesToPath(buildSeries(config.opsGraphBaseline ?? 0.42, config.opsGraphFluctuation ?? 0.08, 0))
  );
  const tRef = useRef(0);
  const visibleRef = useRef(true);
  const sectionRef = useRef<HTMLElement>(null);

  const baseline = config.opsGraphBaseline ?? 0.42;
  const fluctuation = config.opsGraphFluctuation ?? 0.08;
  const speed = config.opsGraphSpeed ?? 1;

  const sectors = useMemo(
    () => PACKAGE_CONFIG.map((pkg) => ({ id: pkg.slug, name: pkg.subtitle })),
    []
  );

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
        visibleRef.current = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPath(seriesToPath(buildSeries(baseline, fluctuation, tRef.current)));
    if (reducedMotion) return;

    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (visibleRef.current && now - last > 32) {
        last = now;
        tRef.current += 0.045 * speed;
        setPath(seriesToPath(buildSeries(baseline, fluctuation, tRef.current)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [baseline, fluctuation, speed, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={cn("section-pad bg-section", className)}
      aria-labelledby="live-ops-heading"
    >
      <div className="container-ar">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="live-ops-heading"
            className="text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl"
          >
            {config.opsHeadline}
          </h2>
          <p className="mt-2.5 text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            {config.opsDescription}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-md)] sm:p-5">
          <div className="relative w-full overflow-hidden rounded-[var(--radius-sm)] bg-[var(--gray-50)] ring-1 ring-[var(--border)]">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="block h-auto w-full"
              style={{ minHeight: 200, aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
              role="img"
              aria-label="Live operational activity trend across Alto Rich investment sectors"
            >
              <defs>
                <linearGradient id={`ops-fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4a853" stopOpacity="0.45" />
                  <stop offset="55%" stopColor="#d4a853" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#d4a853" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Guide lines so the chart area never reads as empty */}
              {[0.25, 0.5, 0.75].map((ratio) => (
                <line
                  key={ratio}
                  x1={PAD_X}
                  y1={PAD_Y + (VIEW_H - PAD_Y * 2) * ratio}
                  x2={VIEW_W - PAD_X}
                  y2={PAD_Y + (VIEW_H - PAD_Y * 2) * ratio}
                  stroke="currentColor"
                  className="text-[var(--border-strong)]"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                  opacity="0.7"
                />
              ))}

              <path d={path.area} fill={`url(#ops-fill-${gradientId})`} />
              <path
                d={path.line}
                fill="none"
                stroke="#d4a853"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={path.tip.x} cy={path.tip.y} r="14" fill="#10b981" opacity="0.2" />
              <circle cx={path.tip.x} cy={path.tip.y} r="6" fill="#10b981" />
              <circle cx={path.tip.x} cy={path.tip.y} r="2.5" fill="#ffffff" />
            </svg>
          </div>
        </div>

        <ul className="mx-auto mt-6 grid max-w-4xl gap-2.5 sm:grid-cols-2">
          {sectors.map((sector) => (
            <li
              key={sector.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3.5 shadow-[var(--shadow-sm)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="live-dot shrink-0 shadow-[0_0_0_4px_color-mix(in_srgb,var(--emerald-light)_22%,transparent)]"
                  aria-hidden
                />
                <span className="truncate text-sm font-medium text-[var(--heading)]">{sector.name}</span>
              </div>
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--emerald)]">
                {config.opsStatusLabel}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
