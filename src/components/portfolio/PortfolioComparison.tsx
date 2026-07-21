import { INVESTMENT_PORTFOLIOS } from "@/config/investment-portfolios";
import { formatNaira } from "@/lib/domain";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  highlightSlug?: string;
};

export function PortfolioComparison({ className, highlightSlug }: Props) {
  const portfolios = [...INVESTMENT_PORTFOLIOS].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-[0.08em] text-[var(--text-subtle)]">
            <th className="px-3 py-3 font-semibold">Strategy</th>
            <th className="px-3 py-3 font-semibold">Portfolio</th>
            <th className="px-3 py-3 font-semibold">Daily return</th>
            <th className="px-3 py-3 font-semibold">Minimum</th>
            <th className="px-3 py-3 font-semibold">Maximum</th>
          </tr>
        </thead>
        <tbody>
          {portfolios.map((p) => (
            <tr
              key={p.slug}
              className={cn(
                "border-b border-[var(--border)]",
                highlightSlug === p.slug && "bg-[var(--emerald-soft)]/30"
              )}
            >
              <td className="px-3 py-3 font-semibold text-[var(--heading)]">{p.strategy}</td>
              <td className="px-3 py-3 text-[var(--text-muted)]">{p.name}</td>
              <td className="px-3 py-3 font-semibold text-[var(--emerald)]">{p.dailyReturnRate}%</td>
              <td className="currency-ngn px-3 py-3 tabular-nums">{formatNaira(p.minimumInvestment)}</td>
              <td className="currency-ngn px-3 py-3 tabular-nums">{formatNaira(p.maximumInvestment)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
