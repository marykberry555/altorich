import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { DownloadAppBadge } from "@/components/pwa/DownloadAppBadge";
import { hero, howItWorks, trustIndicators, sampleTestimonials, faqs } from "@/content/site";
import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";
import { PACKAGE_CONFIG } from "@/lib/packages/package-config";
import { PageHero } from "@/components/marketing/PageHero";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PackageCard } from "@/components/marketing/PackageCard";
import { TestimonialsMarquee } from "@/components/marketing/TestimonialsMarquee";
import { WeeklyCountdown } from "@/components/roi/WeeklyCountdown";
import { StepNumber } from "@/components/ui/StepNumber";

export function HomePage() {
  const investmentCategories = PACKAGE_CONFIG.map((pkg) => ({
    slug: pkg.slug,
    title: pkg.title,
    subtitle: pkg.subtitle,
    description: pkg.cardDescription,
    href: `/packages/${pkg.slug}`,
    image: pkg.image,
    keyBenefits: pkg.keyBenefits,
    bestFor: pkg.bestFor,
    ctaLabel: pkg.ctaLabel
  }));

  return (
    <>
      <section className="gradient-hero relative overflow-hidden section-pad">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.14),transparent_55%)]" aria-hidden />
        <div className="container-ar relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="animate-fade-up">
            <Badge variant="emerald">{hero.eyebrow}</Badge>
            <h1 className="mt-5 max-w-xl text-4xl font-bold tracking-tight text-[var(--heading)] sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
              {hero.title}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
              {hero.subtitle}
            </p>
            {"guarantee" in hero && hero.guarantee ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--emerald)]">
                <ShieldCheck size={16} aria-hidden />
                {hero.guarantee}
              </p>
            ) : null}
            <div className="mt-6">
              <WeeklyCountdown />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <Link href="/auth/register" className="min-w-0 flex-1 sm:max-w-xs">
                <Button size="lg" className="h-13 w-full gap-2 shadow-[var(--shadow-glow)]">
                  {hero.ctaPrimary}
                  <ArrowRight size={18} className="shrink-0" aria-hidden />
                </Button>
              </Link>
              <DownloadAppBadge
                size="lg"
                label="Get the app"
                tone="primary"
                className="h-13 w-full min-w-0 justify-center sm:max-w-[11rem]"
              />
            </div>
            <p className="mt-4 text-xs text-[var(--text-subtle)]">
              UK-registered · Naira-native · Monday 09:00 WAT payouts
            </p>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] ring-1 ring-black/5">
              <Image
                src={IMAGES.hero.src}
                alt={IMAGES.hero.alt}
                width={800}
                height={600}
                className="aspect-[4/3] h-auto w-full object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-4 left-4 right-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]/95 p-4 shadow-[var(--shadow-md)] backdrop-blur sm:left-auto sm:right-6 sm:w-72">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)]">
                {PLATFORM_EARNING.modelName}
              </p>
              <p className="mt-1 text-lg font-bold text-[var(--heading)]">
                {PLATFORM_EARNING.currentDailyRateLabel}: up to {PLATFORM_EARNING.dailyReturnPercent}%
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {PLATFORM_EARNING.currentWeeklyEquivalentLabel}: {PLATFORM_EARNING.weeklyReturnPercent}% ·{" "}
                {PLATFORM_EARNING.payoutTiming}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar">
          <PageHero
            eyebrow="Investment sectors"
            title="Choose Your Investment Sector"
            description="Diversify your wealth across professionally managed investment sectors while earning through Alto Rich's unified Platform Earning Model."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {investmentCategories.map((cat) => (
              <PackageCard key={cat.slug} pkg={cat} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar">
          <PageHero eyebrow="How it works" title="Four steps to Monday earnings" align="center" className="mx-auto" />
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step) => (
              <div key={step.step} className="relative">
                <StepNumber value={step.step} size="lg" />
                <h3 className="mt-3 font-semibold text-[var(--heading)]">{step.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gradient-navy section-pad text-white">
        <div className="container-ar grid gap-10 lg:grid-cols-2">
          <PageHero
            dark
            eyebrow="Trust"
            title="Built on verification, not promises."
            description={`Every deposit is reconciled. Every payout follows published windows. One ${PLATFORM_EARNING.modelName} — up to ${PLATFORM_EARNING.dailyReturnPercent}% daily — guaranteed.`}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {trustIndicators.map((item) => (
              <div key={item.label} className="rounded-[var(--radius)] border border-white/10 bg-white/5 p-5 card-lift">
                <p className="text-xs uppercase tracking-wider text-white/50">{item.label}</p>
                <p className="mt-2 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--gold-soft)]">
        <div className="container-ar">
          <PageHero eyebrow="Members" title="What members say" align="center" className="mx-auto" />
          <div className="mt-10">
            <TestimonialsMarquee
              items={sampleTestimonials.map((t) => ({ name: t.name, role: t.role, quote: t.quote }))}
            />
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar max-w-3xl">
          <PageHero eyebrow="FAQ" title="Common questions" align="center" className="mx-auto" />
          <div className="mt-10 space-y-4">
            {faqs.map((item) => (
              <details key={item.q} className="group rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-50)] p-5">
                <summary className="cursor-pointer font-semibold text-[var(--heading)]">{item.q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/learn/faq">
              <Button variant="outline">View all FAQs</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--emerald-soft)]">
        <div className="container-ar text-center">
          <h2 className="text-3xl font-bold text-[var(--heading)]">Ready when you are</h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--text-muted)]">
            Open an account, fund your wallet, and earn on Monday.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/auth/register">
              <Button size="lg" className="shadow-[var(--shadow-glow)]">
                Open an account
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">
                Talk to support
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
