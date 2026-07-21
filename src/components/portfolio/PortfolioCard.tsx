import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getPortfolioBySlug, type PortfolioSlug } from "@/config/investment-portfolios";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PortfolioBadge } from "@/components/portfolio/PortfolioBadge";
import { PortfolioHierarchy } from "@/components/portfolio/PortfolioHierarchy";

type Props = {
  slug: PortfolioSlug;
  compact?: boolean;
  href?: string;
};

export function PortfolioCard({ slug, compact = false, href }: Props) {
  const portfolio = getPortfolioBySlug(slug);
  if (!portfolio) return null;

  const cardHref = href ?? `/packages/${slug}`;

  return (
    <Card
      variant="elevated"
      padding="none"
      className="group flex h-full flex-col overflow-hidden transition hover:border-[var(--emerald-mid)] hover:shadow-[var(--shadow-glow)]"
    >
      <Link href={cardHref} className="relative block aspect-[16/10] overflow-hidden bg-[var(--gray-100)]">
        <Image
          src={portfolio.image.src}
          alt={portfolio.image.alt}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes={compact ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" : "(max-width: 640px) 100vw, 50vw"}
        />
        {portfolio.badge ? (
          <span className="absolute left-3 top-3">
            <PortfolioBadge slug={slug} className="bg-white/90 text-[var(--heading)]" />
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={cardHref} className="block transition hover:opacity-90">
          <PortfolioHierarchy
            strategy={portfolio.strategy}
            name={portfolio.name}
            dailyReturnPercent={portfolio.dailyReturnRate}
            minNgn={portfolio.minimumInvestment}
            maxNgn={portfolio.maximumInvestment}
          />
        </Link>
        <p className={`mt-3 leading-relaxed text-[var(--text-muted)] ${compact ? "text-sm line-clamp-3" : "text-sm"}`}>
          {portfolio.cardDescription}
        </p>
        <p className="mt-3 text-xs font-medium text-[var(--heading)]">{portfolio.bestFor}</p>
        <div className={`flex flex-wrap gap-2 ${compact ? "mt-4" : "mt-5"}`}>
          <Link href={cardHref} className={compact ? "flex-1" : undefined}>
            <Button variant="outline" size="sm" className={compact ? "w-full" : undefined}>
              Learn More
            </Button>
          </Link>
          <Link href="/auth/register" className={compact ? "flex-1" : undefined}>
            <Button size="sm" className={`gap-2 shadow-[var(--shadow-glow)] ${compact ? "w-full" : ""}`}>
              {portfolio.ctaLabel} <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-[var(--text-subtle)]">{portfolio.payoutTiming}</p>
      </div>
    </Card>
  );
}
