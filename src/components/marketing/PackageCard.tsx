import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ImageAsset } from "@/lib/images";
import { formatWeeklyRoiLabel } from "@/lib/packages/package-config";

export type PackageCardData = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  image: ImageAsset;
  weeklyRoiPercent?: number;
  keyBenefits?: string[];
  ctaLabel?: string;
};

type Props = {
  pkg: PackageCardData;
  compact?: boolean;
};

export function PackageCard({ pkg, compact = false }: Props) {
  return (
    <Card variant="elevated" padding="none" className="group flex h-full flex-col overflow-hidden transition hover:border-[var(--emerald-mid)] hover:shadow-[var(--shadow-glow)]">
      <Link href={pkg.href} className="relative block aspect-[16/10] overflow-hidden bg-[var(--gray-100)]">
        <Image
          src={pkg.image.src}
          alt={pkg.image.alt}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes={compact ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" : "(max-width: 640px) 100vw, 50vw"}
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--emerald)]">{pkg.subtitle}</p>
          {pkg.weeklyRoiPercent != null ? (
            <Badge variant="emerald">{formatWeeklyRoiLabel(pkg.weeklyRoiPercent)}</Badge>
          ) : null}
        </div>
        <h3 className="mt-2 font-semibold text-[var(--heading)]">
          <Link href={pkg.href} className="transition hover:text-[var(--emerald)]">
            {pkg.title}
          </Link>
        </h3>
        <p className={`mt-2 flex-1 leading-relaxed text-[var(--text-muted)] ${compact ? "text-sm line-clamp-3" : "text-sm"}`}>
          {pkg.description}
        </p>
        {pkg.keyBenefits?.length ? (
          <ul className={`space-y-1.5 text-xs text-[var(--text-muted)] ${compact ? "mt-3" : "mt-4"}`}>
            {pkg.keyBenefits.slice(0, 3).map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--emerald)]" aria-hidden />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className={`flex flex-wrap gap-2 ${compact ? "mt-4" : "mt-5"}`}>
          {!compact ? (
            <Link href={pkg.href}>
              <Button variant="outline" size="sm">
                View package
              </Button>
            </Link>
          ) : null}
          <Link href="/auth/register" className={compact ? "w-full" : undefined}>
            <Button size="sm" className={`gap-2 shadow-[var(--shadow-glow)] ${compact ? "w-full" : ""}`}>
              {pkg.ctaLabel ?? "Get Started"} <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
