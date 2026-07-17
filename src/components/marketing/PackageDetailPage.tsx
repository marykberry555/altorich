import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Shield, TrendingUp, Wallet, CheckCircle2 } from "lucide-react";
import type { PackageContent } from "@/content/packages";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StepNumber } from "@/components/ui/StepNumber";
import { getPackageConfig } from "@/lib/packages/package-config";
import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";

const benefitIcons = [Shield, TrendingUp, Wallet, CheckCircle2] as const;

type Props = {
  pkg: PackageContent;
};

export function PackageDetailPage({ pkg }: Props) {
  const config = getPackageConfig(pkg.slug);

  return (
    <>
      <section className="gradient-hero section-pad-hero">
        <div className="container-ar max-w-5xl">
          <Link
            href="/packages"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition hover:text-[var(--heading)]"
          >
            <ArrowLeft size={16} /> All investment sectors
          </Link>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="emerald">{pkg.subtitle}</Badge>
                <Badge variant="gold">{PLATFORM_EARNING.modelName}</Badge>
              </div>
              <PageHero
                className="mt-4"
                eyebrow="Investment sector"
                title={pkg.title}
                description={pkg.heroHeadline}
              />
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">{pkg.heroDescription}</p>
              {config?.whyChoose ? (
                <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">
                    Why choose this sector?
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{config.whyChoose}</p>
                  {config.bestFor ? (
                    <p className="mt-2 text-xs font-medium text-[var(--heading)]">{config.bestFor}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-lg)]">
              <Image
                src={pkg.image.src}
                alt={pkg.image.alt}
                width={800}
                height={520}
                className="h-[300px] w-full object-cover sm:h-[360px]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar max-w-5xl">
          <h2 className="text-2xl font-bold text-[var(--heading)]">How it works</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
            A transparent deployment path from wallet allocation to cycle completion — designed for clarity at every step.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {pkg.howItWorks.map((step) => (
              <Card key={step.step} variant="elevated" className="h-full">
                <div className="flex items-center gap-3">
                  <StepNumber value={step.step} />
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--emerald)]">Step {step.step}</span>
                </div>
                <h3 className="mt-3 font-semibold text-[var(--heading)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar max-w-5xl">
          <h2 className="text-2xl font-bold text-[var(--heading)]">Sector Benefits</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {pkg.benefits.map((benefit, i) => {
              const Icon = benefitIcons[i % benefitIcons.length];
              return (
                <Card key={benefit.title} variant="outline" className="h-full border-[var(--border)] bg-[var(--card)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)]">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--heading)]">{benefit.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{benefit.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar max-w-5xl">
          <h2 className="text-2xl font-bold text-[var(--heading)]">How to access</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Yields, rates, and live balances are available only after you sign in. Follow these steps to get started.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pkg.accessSteps.map((step) => (
              <div key={step.step} className="relative rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-5">
                <StepNumber value={step.step} size="lg" />
                <h3 className="mt-3 font-semibold text-[var(--heading)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{step.description}</p>
              </div>
            ))}
          </div>

          <Card variant="elevated" className="mt-8 border-[var(--emerald-mid)]/30 bg-[var(--emerald-soft)]/30">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-semibold text-[var(--heading)]">Ready to activate this investment sector?</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Sign in to allocate capital under Alto Rich&apos;s {PLATFORM_EARNING.modelName}.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <Button className="w-full gap-2 shadow-[var(--shadow-glow)]">
                    Get Started <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
