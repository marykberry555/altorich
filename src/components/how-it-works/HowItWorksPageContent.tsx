import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  CAPITAL_ALLOCATION,
  HOW_IT_WORKS_FAQ,
  HOW_IT_WORKS_PAGE,
  MEMBER_JOURNEY_STEPS,
  TRANSPARENCY_HIGHLIGHTS,
  WEEKLY_SETTLEMENT_REASONS
} from "@/content/how-it-works-page";
import { PageHero } from "@/components/marketing/PageHero";
import { MemberJourneyFlow } from "@/components/how-it-works/MemberJourneyFlow";
import { PortfolioFocusGrid } from "@/components/how-it-works/PortfolioFocusGrid";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function HowItWorksPageContent() {
  return (
    <>
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden section-pad-hero">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.07),transparent_55%)]"
          aria-hidden
        />
        <div className="container-ar relative">
          <PageHero
            eyebrow={HOW_IT_WORKS_PAGE.hero.eyebrow}
            title={HOW_IT_WORKS_PAGE.hero.title}
            description={HOW_IT_WORKS_PAGE.hero.description}
            align="center"
            className="mx-auto max-w-3xl"
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={HOW_IT_WORKS_PAGE.cta.primary.href}>
              <Button size="lg" className="gap-2">
                {HOW_IT_WORKS_PAGE.cta.primary.label}
                <ArrowRight size={16} aria-hidden />
              </Button>
            </Link>
            <Link href={HOW_IT_WORKS_PAGE.cta.secondary.href}>
              <Button variant="outline" size="lg">
                {HOW_IT_WORKS_PAGE.cta.secondary.label}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 1: Member journey */}
      <section className="section-pad bg-section" aria-labelledby="member-journey-heading">
        <div className="container-ar">
          <PageHero
            eyebrow="The member journey"
            title="From registration to settlement"
            description="Nine clear stages — what happens, in order, without confidential operational detail."
            className="max-w-2xl"
          />
          <h2 id="member-journey-heading" className="sr-only">
            The member journey
          </h2>
          <div className="mt-10 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:p-10">
            <MemberJourneyFlow steps={MEMBER_JOURNEY_STEPS} />
          </div>
        </div>
      </section>

      {/* Section 2: Capital allocation */}
      <section className="section-pad bg-[var(--gray-50)]" aria-labelledby="capital-allocation-heading">
        <div className="container-ar">
          <PageHero
            eyebrow={CAPITAL_ALLOCATION.eyebrow}
            title={CAPITAL_ALLOCATION.title}
            description={CAPITAL_ALLOCATION.description}
            className="max-w-3xl"
          />
          <h2 id="capital-allocation-heading" className="sr-only">
            Capital allocation approach
          </h2>
          <div className="mt-8">
            <PortfolioFocusGrid portfolios={CAPITAL_ALLOCATION.portfolios} />
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[var(--text-subtle)]">
            {CAPITAL_ALLOCATION.disclaimer}
          </p>
        </div>
      </section>

      {/* Section 3: Weekly settlements */}
      <section className="section-pad bg-section" aria-labelledby="weekly-settlement-heading">
        <div className="container-ar grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <PageHero
              eyebrow={WEEKLY_SETTLEMENT_REASONS.eyebrow}
              title={WEEKLY_SETTLEMENT_REASONS.title}
              description={WEEKLY_SETTLEMENT_REASONS.description}
            />
            <p className="mt-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--emerald-soft)]/40 px-4 py-3 text-sm text-[var(--heading)]">
              {WEEKLY_SETTLEMENT_REASONS.scheduleNote}
            </p>
          </div>
          <div className="grid gap-3">
            {WEEKLY_SETTLEMENT_REASONS.reasons.map((reason) => (
              <Card key={reason.title} variant="elevated" padding="md">
                <h3 className="font-semibold text-[var(--heading)]">{reason.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{reason.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Transparency */}
      <section className="gradient-navy section-pad text-white" aria-labelledby="transparency-highlights-heading">
        <div className="container-ar">
          <PageHero
            dark
            eyebrow={TRANSPARENCY_HIGHLIGHTS.eyebrow}
            title={TRANSPARENCY_HIGHLIGHTS.title}
            description={TRANSPARENCY_HIGHLIGHTS.description}
            align="center"
            className="mx-auto max-w-2xl"
          />
          <h2 id="transparency-highlights-heading" className="sr-only">
            Transparency highlights
          </h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRANSPARENCY_HIGHLIGHTS.items.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/10"
              >
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{item.description}</p>
                <p className="mt-3 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--gold-light)] group-hover:underline">
                  {item.cta}
                  <ChevronRight size={12} aria-hidden />
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={HOW_IT_WORKS_PAGE.cta.transparency.href}>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                {HOW_IT_WORKS_PAGE.cta.transparency.label}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 5: FAQ */}
      <section className="section-pad bg-section" aria-labelledby="how-it-works-faq-heading">
        <div className="container-ar max-w-3xl">
          <PageHero eyebrow="Questions" title="Frequent questions" align="center" className="mx-auto" />
          <h2 id="how-it-works-faq-heading" className="sr-only">
            Frequent questions
          </h2>
          <div className="mt-8 space-y-3">
            {HOW_IT_WORKS_FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-50)] p-5"
              >
                <summary className="cursor-pointer font-semibold text-[var(--heading)]">{item.q}</summary>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/learn/faq">
              <Button variant="outline">Full FAQ Centre</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline">Contact support</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="section-pad-sm bg-[var(--emerald-soft)]/30">
        <div className="container-ar text-center">
          <p className="text-lg font-semibold text-[var(--heading)]">Ready to begin with clarity?</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">
            Open an account, review portfolios, and follow every step from your dashboard.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={HOW_IT_WORKS_PAGE.cta.primary.href}>
              <Button size="lg">{HOW_IT_WORKS_PAGE.cta.primary.label}</Button>
            </Link>
            <Link href={HOW_IT_WORKS_PAGE.cta.secondary.href}>
              <Button variant="outline" size="lg">
                {HOW_IT_WORKS_PAGE.cta.secondary.label}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
