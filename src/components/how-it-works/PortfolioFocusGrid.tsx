import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CAPITAL_ALLOCATION } from "@/content/how-it-works-page";
import { PortfolioHierarchy } from "@/components/portfolio/PortfolioHierarchy";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Portfolio = (typeof CAPITAL_ALLOCATION)["portfolios"][number];

type Props = {
  portfolios: readonly Portfolio[];
  className?: string;
};

export function PortfolioFocusGrid({ portfolios, className }: Props) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {portfolios.map((portfolio) => (
        <Card key={portfolio.slug} variant="elevated" padding="lg" className="flex h-full flex-col">
          <PortfolioHierarchy
            strategy={portfolio.strategy}
            name={portfolio.name}
            dailyReturnPercent={portfolio.dailyReturnRate}
            minNgn={portfolio.minimumInvestment}
            maxNgn={portfolio.maximumInvestment}
          />
          <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">{portfolio.summary}</p>
          <Link
            href={portfolio.href}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--emerald)] hover:underline"
          >
            View portfolio details
            <ArrowRight size={14} aria-hidden />
          </Link>
        </Card>
      ))}
    </div>
  );
}
