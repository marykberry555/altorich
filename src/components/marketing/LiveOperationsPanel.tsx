"use client";

import { useEffect, useRef, useState } from "react";
import { PACKAGE_CONFIG } from "@/lib/packages/package-config";
import type { HomepageStatsConfig } from "@/lib/homepage/homepage-stats";
import { cn } from "@/lib/utils";

type Props = {
  config: HomepageStatsConfig;
  className?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Soft operational activity visualization — upward trend with gentle fluctuations.
 * Deliberately not a candlestick / trading / crypto chart.
 */
export function LiveOperationsPanel({ config, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const points = 48;
    const history = Array.from({ length: points }, (_, i) => config.opsGraphBaseline + (i / points) * 0.28);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth;
      const height = Math.max(180, Math.min(260, Math.round(width * 0.32)));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const gold = getComputedStyle(document.documentElement).getPropertyValue("--gold").trim() || "#d4a853";
    const emerald =
      getComputedStyle(document.documentElement).getPropertyValue("--emerald-light").trim() || "#10b981";

    let t = 0;
    const draw = () => {
      if (!running) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);

      if (!reducedMotion) {
        t += 0.016 * config.opsGraphSpeed;
        const trend = config.opsGraphBaseline + Math.min(0.45, t * 0.012);
        const wave =
          Math.sin(t * 1.1) * config.opsGraphFluctuation * 0.55 +
          Math.sin(t * 0.37 + 1.2) * config.opsGraphFluctuation * 0.35;
        const next = Math.min(0.92, Math.max(0.08, trend + wave));
        history.push(next);
        if (history.length > points) history.shift();
      }

      const padX = 8;
      const padY = 16;
      const usableW = width - padX * 2;
      const usableH = height - padY * 2;

      const coords = history.map((v, i) => {
        const x = padX + (i / (history.length - 1)) * usableW;
        const y = padY + (1 - v) * usableH;
        return { x, y };
      });

      // Soft fill
      ctx.beginPath();
      coords.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.lineTo(coords[coords.length - 1]!.x, height - padY);
      ctx.lineTo(coords[0]!.x, height - padY);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, padY, 0, height);
      fill.addColorStop(0, "rgba(212,168,83,0.28)");
      fill.addColorStop(1, "rgba(212,168,83,0)");
      ctx.fillStyle = fill;
      ctx.fill();

      // Gold line
      ctx.beginPath();
      coords.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      // Activity pulse at tip
      const tip = coords[coords.length - 1]!;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = emerald;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 9 + (reducedMotion ? 0 : Math.sin(t * 3) * 2), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(16,185,129,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (!reducedMotion) raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [config.opsGraphBaseline, config.opsGraphFluctuation, config.opsGraphSpeed, reducedMotion]);

  return (
    <section className={cn("section-pad bg-section", className)} aria-labelledby="live-ops-heading">
      <div className="container-ar">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            <span className="live-dot" aria-hidden />
            {config.opsHeadline}
          </p>
          <h2
            id="live-ops-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl"
          >
            {config.opsHeadline}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            {config.opsDescription}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-md)] sm:p-6">
          <canvas
            ref={canvasRef}
            className="w-full"
            role="img"
            aria-label="Live operational activity trend across Alto Rich investment sectors"
          />
        </div>

        <ul className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
          {PACKAGE_CONFIG.map((pkg) => (
            <li
              key={pkg.slug}
              className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3.5 shadow-[var(--shadow-sm)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="live-dot shrink-0 shadow-[0_0_0_4px_color-mix(in_srgb,var(--emerald-light)_22%,transparent)]"
                  aria-hidden
                />
                <span className="truncate text-sm font-medium text-[var(--heading)]">{pkg.subtitle}</span>
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
