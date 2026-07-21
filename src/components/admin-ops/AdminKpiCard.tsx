import Link from "next/link";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutiveKpi, KpiComparison } from "@/lib/admin-ops/types";

const accentBorder: Record<NonNullable<ExecutiveKpi["accent"]>, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  gold: "border-yellow-500/30 bg-yellow-500/5",
  navy: "border-blue-500/30 bg-blue-500/5",
  sky: "border-sky-500/30 bg-sky-500/5"
};

function Comparison({ comparison }: { comparison: KpiComparison }) {
  if (!comparison) return null;
  const Icon = comparison.direction === "up" ? ArrowUp : comparison.direction === "down" ? ArrowDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold",
        comparison.direction === "up" && "text-emerald-400",
        comparison.direction === "down" && "text-red-400",
        comparison.direction === "flat" && "text-zinc-400"
      )}
    >
      <Icon size={10} aria-hidden />
      {comparison.value}
      <span className="font-normal text-zinc-500">{comparison.label}</span>
    </span>
  );
}

type Props = ExecutiveKpi & { className?: string };

export function AdminKpiCard({ label, value, href, accent = "emerald", comparison, className }: Props) {
  const inner = (
    <div
      className={cn(
        "rounded-xl border p-4 transition hover:brightness-110",
        accentBorder[accent],
        href && "cursor-pointer",
        className
      )}
    >
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-white">{value}</p>
      {comparison ? (
        <div className="mt-2">
          <Comparison comparison={comparison} />
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
        {inner}
      </Link>
    );
  }

  return inner;
}
