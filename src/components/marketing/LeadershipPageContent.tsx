import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Globe2,
  Landmark,
  MapPin,
  Scale,
  Shield,
  ShieldCheck,
  Target,
  Users
} from "lucide-react";
import { ExecutiveCard } from "@/components/marketing/ExecutiveCard";
import { LeadershipPortrait } from "@/components/marketing/LeadershipPortrait";
import { PageHero } from "@/components/marketing/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  EXECUTIVES,
  getFounder,
  GOVERNANCE_PILLARS,
  LEADERSHIP_COMMITMENTS,
  LEADERSHIP_PAGE,
  LEADERSHIP_PRINCIPLES,
  LEADERSHIP_TIMELINE,
  OFFICE_LOCATIONS
} from "@/content/leadership";
import { COMPANY } from "@/lib/company";
import type { LeadershipImageSlug } from "@/lib/leadership-images";
import { cn } from "@/lib/utils";

const PRINCIPLE_ICONS = [ShieldCheck, Scale, Target, Building2, Globe2, Shield, Users, Landmark] as const;

const GOVERNANCE_ICONS = [Scale, ShieldCheck, Shield, Building2, Users, Globe2, Landmark, Target] as const;

export function LeadershipPageContent() {
  const founder = getFounder();

  return (
    <>
      {/* Hero */}
      <section className="gradient-hero section-pad-hero relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.08),transparent_50%)]"
          aria-hidden
        />
        <div className="container-ar relative">
          <PageHero
            eyebrow={LEADERSHIP_PAGE.hero.eyebrow}
            title={LEADERSHIP_PAGE.hero.title}
            description={LEADERSHIP_PAGE.hero.description}
            align="center"
            className="mx-auto animate-fade-up"
          />
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
            {["Integrity", "Transparency", "Operational Excellence", "Member-First"].map((item) => (
              <Badge key={item} variant="outline" className="border-[var(--gold)]/30 bg-white/60 text-[var(--heading)]">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Founder's Message */}
      <section className="section-pad bg-section" aria-labelledby="founder-message-heading">
        <div className="container-ar">
          <div className="grid gap-10 lg:grid-cols-[minmax(280px,360px)_1fr] lg:gap-14">
            <div className="animate-fade-up">
              <LeadershipPortrait
                slug={founder.imageSlug as LeadershipImageSlug}
                priority
                className="mx-auto max-w-[360px] shadow-[var(--shadow-lg)]"
                sizes="(max-width: 1024px) 80vw, 360px"
              />
              <div className="mt-6 text-center lg:text-left">
                <p className="font-semibold text-[var(--heading)]">{LEADERSHIP_PAGE.founderMessage.signature}</p>
                <p className="text-sm text-[var(--text-muted)]">{LEADERSHIP_PAGE.founderMessage.signatureTitle}</p>
              </div>
            </div>

            <div>
              <PageHero
                eyebrow={LEADERSHIP_PAGE.founderMessage.eyebrow}
                title={LEADERSHIP_PAGE.founderMessage.title}
              />
              <div className="mt-6 space-y-5 text-base leading-relaxed text-[var(--text-muted)]">
                {LEADERSHIP_PAGE.founderMessage.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
              <p className="mt-8 font-serif text-2xl italic text-[var(--heading)]" id="founder-message-heading">
                {LEADERSHIP_PAGE.founderMessage.signature}
              </p>
              <p className="text-sm text-[var(--text-muted)]">{LEADERSHIP_PAGE.founderMessage.signatureTitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Executive Leadership */}
      <section className="section-pad bg-[var(--gray-50)]" aria-labelledby="executive-leadership-heading">
        <div className="container-ar">
          <PageHero
            eyebrow={LEADERSHIP_PAGE.executiveSection.eyebrow}
            title={LEADERSHIP_PAGE.executiveSection.title}
            description={LEADERSHIP_PAGE.executiveSection.description}
            align="center"
            className="mx-auto"
          />
          <h2 id="executive-leadership-heading" className="sr-only">
            {LEADERSHIP_PAGE.executiveSection.title}
          </h2>
          <div className="mt-10 space-y-6">
            {EXECUTIVES.map((executive, index) => (
              <ExecutiveCard key={executive.id} executive={executive} defaultExpanded={index === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Principles */}
      <section className="section-pad bg-section" aria-labelledby="leadership-principles-heading">
        <div className="container-ar">
          <PageHero
            eyebrow={LEADERSHIP_PAGE.principlesSection.eyebrow}
            title={LEADERSHIP_PAGE.principlesSection.title}
            description={LEADERSHIP_PAGE.principlesSection.description}
            align="center"
            className="mx-auto"
          />
          <h2 id="leadership-principles-heading" className="sr-only">
            {LEADERSHIP_PAGE.principlesSection.title}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {LEADERSHIP_PRINCIPLES.map((principle, index) => {
              const Icon = PRINCIPLE_ICONS[index % PRINCIPLE_ICONS.length];
              return (
                <Card key={principle.title} variant="elevated" padding="lg" className="h-full card-lift">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)]">
                    <Icon size={20} aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold text-[var(--heading)]">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{principle.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Corporate Governance */}
      <section className="gradient-navy section-pad text-white" aria-labelledby="corporate-governance-heading">
        <div className="container-ar">
          <PageHero
            dark
            eyebrow={LEADERSHIP_PAGE.governanceSection.eyebrow}
            title={LEADERSHIP_PAGE.governanceSection.title}
            description={LEADERSHIP_PAGE.governanceSection.description}
            align="center"
            className="mx-auto"
          />
          <h2 id="corporate-governance-heading" className="sr-only">
            {LEADERSHIP_PAGE.governanceSection.title}
          </h2>

          <div className="mx-auto mt-12 max-w-4xl">
            <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold-light)]">Structure</p>
                  <p className="mt-1 text-lg font-bold">{COMPANY.legalName}</p>
                  <p className="text-sm text-white/60">Co. {COMPANY.companyNumber}</p>
                </div>
                <ChevronRight className="hidden rotate-0 text-[var(--gold-light)] sm:block" aria-hidden />
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold-light)]">Executive Team</p>
                  <p className="mt-1 text-lg font-bold">Four Offices</p>
                  <p className="text-sm text-white/60">London · Lagos · Abuja · Port Harcourt</p>
                </div>
                <ChevronRight className="hidden text-[var(--gold-light)] sm:block" aria-hidden />
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold-light)]">Members</p>
                  <p className="mt-1 text-lg font-bold">Protected</p>
                  <p className="text-sm text-white/60">Verification · Transparency · Support</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GOVERNANCE_PILLARS.map((pillar, index) => {
              const Icon = GOVERNANCE_ICONS[index % GOVERNANCE_ICONS.length];
              return (
                <div
                  key={pillar.title}
                  className="rounded-[var(--radius)] border border-white/10 bg-white/5 p-5 card-lift"
                >
                  <Icon size={22} className="text-[var(--gold-light)]" aria-hidden />
                  <h3 className="mt-3 font-semibold">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{pillar.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Operational Footprint */}
      <section className="section-pad bg-[var(--gray-50)]" aria-labelledby="operational-footprint-heading">
        <div className="container-ar">
          <PageHero
            eyebrow={LEADERSHIP_PAGE.footprintSection.eyebrow}
            title={LEADERSHIP_PAGE.footprintSection.title}
            description={LEADERSHIP_PAGE.footprintSection.description}
            align="center"
            className="mx-auto"
          />
          <h2 id="operational-footprint-heading" className="sr-only">
            {LEADERSHIP_PAGE.footprintSection.title}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {OFFICE_LOCATIONS.map((office) => (
              <Card key={office.city} variant="elevated" padding="lg" className="h-full">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">{office.role}</p>
                    <h3 className="mt-1 text-xl font-bold text-[var(--heading)]">{office.city}</h3>
                    <p className="text-sm text-[var(--text-muted)]">{office.country}</p>
                  </div>
                  <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--navy)] text-white">
                    <MapPin size={18} aria-hidden />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">{office.purpose}</p>
                <ul className="mt-4 space-y-2">
                  {office.responsibilities.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-[var(--text-muted)]">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--emerald)]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 border-t border-[var(--border)] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--heading)]">Support coverage</p>
                  <p className="mt-1.5 text-sm text-[var(--text-muted)]">{office.supportCoverage}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-subtle)]">
                    <MapPin size={12} aria-hidden />
                    {office.address}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Timeline */}
      <section className="section-pad bg-section" aria-labelledby="leadership-timeline-heading">
        <div className="container-ar">
          <PageHero
            eyebrow={LEADERSHIP_PAGE.timelineSection.eyebrow}
            title={LEADERSHIP_PAGE.timelineSection.title}
            description={LEADERSHIP_PAGE.timelineSection.description}
            align="center"
            className="mx-auto"
          />
          <h2 id="leadership-timeline-heading" className="sr-only">
            {LEADERSHIP_PAGE.timelineSection.title}
          </h2>
          <div className="relative mt-14">
            <div
              className="pointer-events-none absolute left-0 right-0 top-4 hidden h-px bg-gradient-to-r from-[var(--gold)]/40 via-[var(--border-strong)] to-[var(--emerald)]/40 md:block"
              aria-hidden
            />
            <ol className="relative grid gap-8 md:grid-cols-3 lg:grid-cols-6 md:gap-4">
              {LEADERSHIP_TIMELINE.map((item, index) => (
                <li key={item.label} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                  <span
                    className={cn(
                      "relative z-[1] mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-[var(--surface-raised)] text-xs font-bold md:mt-0",
                      index === 0 ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--emerald)] text-[var(--emerald)]"
                    )}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[var(--heading)]">{item.label}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)] md:mt-2">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Leadership Commitment */}
      <section className="section-pad bg-[var(--emerald-soft)]" aria-labelledby="leadership-commitment-heading">
        <div className="container-ar">
          <PageHero
            eyebrow={LEADERSHIP_PAGE.commitmentSection.eyebrow}
            title={LEADERSHIP_PAGE.commitmentSection.title}
            description={LEADERSHIP_PAGE.commitmentSection.description}
            align="center"
            className="mx-auto"
          />
          <h2 id="leadership-commitment-heading" className="sr-only">
            {LEADERSHIP_PAGE.commitmentSection.title}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {LEADERSHIP_COMMITMENTS.map((item) => (
              <Card key={item.title} variant="elevated" padding="lg" className="h-full text-center">
                <h3 className="font-semibold text-[var(--heading)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.detail}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-navy section-pad-sm text-white">
        <div className="container-ar text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Questions for our leadership team?</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/70">
            Reach us through our contact page — member support operates on West Africa Time.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact">
              <Button size="lg" className="shadow-[var(--shadow-glow)]">
                Contact us
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                About Alto Rich
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
