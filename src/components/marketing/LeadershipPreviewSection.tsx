import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { LeadershipPortrait } from "@/components/marketing/LeadershipPortrait";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LEADERSHIP_PREVIEW, LEADERSHIP_PAGE } from "@/content/leadership";
import type { LeadershipImageSlug } from "@/lib/leadership-images";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: "light" | "dark";
  showCta?: boolean;
  limit?: number;
};

export function LeadershipPreviewSection({
  className,
  variant = "light",
  showCta = true,
  limit = 4
}: Props) {
  const executives = LEADERSHIP_PREVIEW.slice(0, limit);
  const dark = variant === "dark";

  return (
    <section className={cn(dark ? "gradient-navy section-pad text-white" : "section-pad bg-[var(--gray-50)]", className)}>
      <div className="container-ar">
        <PageHero
          dark={dark}
          eyebrow="Leadership"
          title="Meet Our Leadership"
          description="International governance with a Nigeria-first operations team — committed to transparency, operational excellence, and member trust."
          align="center"
          className="mx-auto"
        />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {executives.map((exec) => (
            <Card
              key={exec.id}
              variant="elevated"
              padding="none"
              className={cn("overflow-hidden", dark && "border-white/10 bg-white/5 text-white")}
            >
              <LeadershipPortrait
                slug={exec.imageSlug as LeadershipImageSlug}
                className="rounded-none shadow-none ring-0"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="p-5">
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.14em]",
                    dark ? "text-[var(--gold-light)]" : "text-[var(--gold)]"
                  )}
                >
                  {exec.title}
                </p>
                <h3 className={cn("mt-1.5 text-lg font-bold", dark ? "text-white" : "text-[var(--heading)]")}>
                  {exec.name}
                </h3>
                <p
                  className={cn(
                    "mt-1 flex items-center gap-1.5 text-xs",
                    dark ? "text-white/60" : "text-[var(--text-muted)]"
                  )}
                >
                  <MapPin size={12} aria-hidden />
                  {exec.office}
                </p>
                <p className={cn("mt-3 text-sm leading-relaxed", dark ? "text-white/75" : "text-[var(--text-muted)]")}>
                  {exec.intro}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {showCta ? (
          <div className="mt-8 text-center">
            <Link href={LEADERSHIP_PAGE.path}>
              <Button variant={dark ? "outline" : "primary"} size="lg" className={dark ? "border-white/30 text-white hover:bg-white/10" : ""}>
                View Leadership
                <ArrowRight size={16} className="ml-1.5" aria-hidden />
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
