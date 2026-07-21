"use client";

import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  FileText,
  Scale,
  Shield,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { ProcessFlowDiagram } from "@/components/transparency/ProcessFlowDiagram";
import { SystemStatusGrid } from "@/components/transparency/SystemStatusGrid";
import { TransparencyLiveOverview } from "@/components/transparency/TransparencyLiveOverview";
import { TransparencyMetricsGrid } from "@/components/transparency/TransparencyMetricsGrid";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  DEPOSIT_FLOW,
  MEMBER_PROTECTION_PILLARS,
  POLICY_LINKS,
  REPORT_CATEGORIES,
  SECURITY_TOPICS,
  TRANSPARENCY_COMMITMENTS,
  TRANSPARENCY_PAGE,
  WITHDRAWAL_FLOW
} from "@/content/transparency";

const PROTECTION_ICONS = {
  shield: Shield,
  clock: CalendarClock,
  calendar: CalendarClock,
  "user-check": UserCheck,
  scale: Scale,
  file: FileText
} as const;

export function TransparencyPageContent() {
  return (
    <>
      <section className="gradient-hero section-pad-hero relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_55%)]" aria-hidden />
        <div className="container-ar relative">
          <PageHero
            eyebrow={TRANSPARENCY_PAGE.hero.eyebrow}
            title={TRANSPARENCY_PAGE.hero.title}
            description={TRANSPARENCY_PAGE.hero.description}
            align="center"
            className="mx-auto max-w-3xl animate-fade-up"
          />
          <div className="mx-auto mt-8 max-w-2xl text-center">
            <Link href="/how-it-works">
              <Button variant="outline" size="lg" className="gap-2">
                How Alto Rich works
                <ChevronRight size={16} aria-hidden />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar">
          <TransparencyLiveOverview />
        </div>
      </section>

      <section className="section-pad bg-[var(--gray-50)]" aria-labelledby="system-status-heading">
        <div className="container-ar">
          <PageHero
            eyebrow="System status"
            title="Operational health"
            description="Current status of core platform services. Status can be updated automatically or during planned maintenance."
            className="max-w-2xl"
          />
          <h2 id="system-status-heading" className="sr-only">
            System status
          </h2>
          <div className="mt-8">
            <SystemStatusGrid />
          </div>
          <div className="mt-6">
            <Link href="/status">
              <Button variant="outline" size="sm">
                Open status page
                <ChevronRight size={14} className="ml-1" aria-hidden />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad bg-section" aria-labelledby="member-protection-heading">
        <div className="container-ar">
          <PageHero
            eyebrow="Member protection"
            title="How your funds are safeguarded"
            description="Clear processes — not promises — for deposits, withdrawals, verification, and reconciliation."
            className="max-w-2xl"
          />
          <h2 id="member-protection-heading" className="sr-only">
            Member protection
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MEMBER_PROTECTION_PILLARS.map((pillar) => {
              const Icon = PROTECTION_ICONS[pillar.icon as keyof typeof PROTECTION_ICONS] ?? ShieldCheck;
              return (
                <Card key={pillar.title} variant="elevated" padding="lg" className="h-full card-lift">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)]">
                    <Icon size={20} aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold text-[var(--heading)]">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{pillar.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar grid gap-10 lg:grid-cols-2">
          <div>
            <PageHero eyebrow="Withdrawals" title="Withdrawal transparency" description="What happens after you request a withdrawal." />
            <div className="mt-8">
              <ProcessFlowDiagram steps={WITHDRAWAL_FLOW} ariaLabel="Withdrawal process" />
            </div>
          </div>
          <div>
            <PageHero eyebrow="Deposits" title="Deposit transparency" description="From bank transfer to ledger entry." />
            <div className="mt-8">
              <ProcessFlowDiagram steps={DEPOSIT_FLOW} ariaLabel="Deposit process" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-section" aria-labelledby="platform-metrics-heading">
        <div className="container-ar">
          <PageHero
            eyebrow="Platform metrics"
            title="Operational statistics"
            description="Only metrics backed by platform data are shown. We do not publish estimates or marketing figures here."
            className="max-w-2xl"
          />
          <h2 id="platform-metrics-heading" className="sr-only">
            Platform metrics
          </h2>
          <div className="mt-8">
            <TransparencyMetricsGrid />
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--gray-50)]" aria-labelledby="report-library-heading">
        <div className="container-ar">
          <PageHero
            eyebrow="Report library"
            title="Published reports and disclosures"
            description="A home for operational, transparency, and compliance reports as they are approved for publication."
            className="max-w-2xl"
          />
          <h2 id="report-library-heading" className="sr-only">
            Report library
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REPORT_CATEGORIES.map((cat) => (
              <Card key={cat.id} variant="elevated" padding="lg" className="h-full">
                <h3 className="font-semibold text-[var(--heading)]">{cat.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{cat.description}</p>
                <p className="mt-4 text-xs font-medium text-[var(--text-subtle)]">No reports published yet.</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-section" aria-labelledby="policies-heading">
        <div className="container-ar">
          <PageHero eyebrow="Policies" title="Legal and compliance documents" className="max-w-2xl" />
          <h2 id="policies-heading" className="sr-only">
            Policies
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {POLICY_LINKS.map((policy) => (
              <Link key={policy.href} href={policy.href} className="group block h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald)] rounded-[var(--radius)]">
                <Card variant="elevated" padding="md" className="h-full transition group-hover:border-[var(--emerald)]/30">
                  <h3 className="font-semibold text-[var(--heading)] group-hover:text-[var(--emerald)]">{policy.label}</h3>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{policy.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="gradient-navy section-pad text-white" aria-labelledby="security-overview-heading">
        <div className="container-ar">
          <PageHero
            dark
            eyebrow="Security"
            title="Security overview"
            description="How Alto Rich protects member accounts and data — explained in plain language."
            className="max-w-2xl"
          />
          <h2 id="security-overview-heading" className="sr-only">
            Security overview
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY_TOPICS.map((topic) => (
              <div key={topic.title} className="rounded-[var(--radius)] border border-white/10 bg-white/5 p-5">
                <h3 className="font-semibold">{topic.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--emerald-soft)]" aria-labelledby="transparency-commitment-heading">
        <div className="container-ar">
          <PageHero
            eyebrow="Our commitment"
            title="Transparency commitment"
            description="The principles that guide how Alto Rich communicates with members."
            align="center"
            className="mx-auto max-w-2xl"
          />
          <h2 id="transparency-commitment-heading" className="sr-only">
            Transparency commitment
          </h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {TRANSPARENCY_COMMITMENTS.map((item) => (
              <Card key={item.title} variant="elevated" padding="lg">
                <h3 className="font-semibold text-[var(--heading)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
