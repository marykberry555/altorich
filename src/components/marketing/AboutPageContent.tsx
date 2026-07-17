import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarClock,
  Check,
  Eye,
  Handshake,
  HeartHandshake,
  Landmark,
  MapPin,
  Scale,
  ShieldCheck,
  Smartphone,
  Target,
  Users,
  Wallet
} from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  aboutPage,
  leadership,
  mission,
  values,
  vision
} from "@/content/site";
import { COMPANY } from "@/lib/company";
import { IMAGES } from "@/lib/images";
import { cn } from "@/lib/utils";

const VALUE_ICONS = {
  Transparency: Eye,
  Discipline: Scale,
  Accessibility: Smartphone,
  Integrity: ShieldCheck
} as const;

const TRUST_ICONS = [
  BookOpen,
  Landmark,
  ShieldCheck,
  Wallet,
  CalendarClock,
  MapPin,
  HeartHandshake
] as const;

const OPERATION_ICONS = [
  Building2,
  Users,
  ShieldCheck,
  Wallet,
  CalendarClock,
  Scale
] as const;

function SectionEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]",
        className
      )}
    >
      {children}
    </p>
  );
}

export function AboutPageContent() {
  const { hero, story, trustReasons, operations, timeline, stats, cta } = aboutPage;

  return (
    <>
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden section-pad-hero">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,168,83,0.12),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[var(--emerald)]/10 blur-3xl"
          aria-hidden
        />
        <div className="container-ar relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="animate-fade-up">
            <Badge variant="gold">{hero.eyebrow}</Badge>
            <h1 className="mt-4 max-w-xl text-4xl font-bold tracking-tight text-[var(--heading)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {hero.title}
            </h1>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
              {hero.description}
            </p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2" aria-label="Trust indicators">
              {hero.trustItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm font-medium text-[var(--text)]"
                >
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)]">
                    <Check size={14} strokeWidth={2.5} aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[var(--text-subtle)]">
              {COMPANY.legalName} · Company No. {COMPANY.companyNumber} · Lagos operations hub
            </p>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="absolute -inset-3 rounded-[calc(var(--radius-lg)+8px)] bg-gradient-to-br from-[var(--gold)]/20 via-transparent to-[var(--emerald)]/15 blur-sm" aria-hidden />
            <div className="relative overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] ring-1 ring-black/5">
              <Image
                src={IMAGES.about.src}
                alt={IMAGES.about.alt}
                width={1024}
                height={1536}
                className="aspect-[4/5] h-auto w-full object-cover object-top sm:aspect-[3/4] lg:max-h-[560px]"
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="section-pad bg-section">
        <div className="container-ar grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div>
            <SectionEyebrow>{story.eyebrow}</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl">
              {story.title}
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            {story.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar">
          <PageHero
            eyebrow="Purpose"
            title="Mission & vision"
            description="Clear intent — written for Nigerians who want wealth tools they can trust."
            align="center"
            className="mx-auto"
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card
              variant="elevated"
              padding="lg"
              className="group card-lift transition-[transform,box-shadow] duration-[var(--motion-base)]"
            >
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--emerald-soft)] text-[var(--emerald)] transition group-hover:scale-105">
                <Target size={22} aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-bold text-[var(--heading)]">{mission.title}</h3>
              <p className="mt-3 leading-relaxed text-[var(--text-muted)]">{mission.body}</p>
            </Card>
            <Card
              variant="elevated"
              padding="lg"
              className="group card-lift transition-[transform,box-shadow] duration-[var(--motion-base)]"
            >
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--gold-soft)] text-[var(--gold)] transition group-hover:scale-105">
                <Handshake size={22} aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-bold text-[var(--heading)]">{vision.title}</h3>
              <p className="mt-3 leading-relaxed text-[var(--text-muted)]">{vision.body}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-pad bg-section">
        <div className="container-ar">
          <PageHero
            eyebrow="Values"
            title="What we stand for"
            description="Principles that shape every ledger entry, settlement, and member conversation."
            align="center"
            className="mx-auto"
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = VALUE_ICONS[value.title as keyof typeof VALUE_ICONS] ?? ShieldCheck;
              return (
                <Card
                  key={value.title}
                  variant="elevated"
                  className="card-lift h-full transition-[transform,box-shadow] duration-[var(--motion-base)]"
                >
                  <div className="inline-flex size-11 items-center justify-center rounded-xl bg-[var(--navy-soft)] text-[var(--heading)]">
                    <Icon size={20} aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold text-[var(--heading)]">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                    {value.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar">
          <PageHero
            eyebrow="Trust"
            title="Why members trust us"
            description="From Victoria Island to Garki, members choose Alto Rich because the rules are published and the records are real."
            align="center"
            className="mx-auto"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trustReasons.map((reason, index) => {
              const Icon = TRUST_ICONS[index % TRUST_ICONS.length];
              return (
                <Card key={reason.title} variant="elevated" className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)]">
                      <Icon size={18} aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--heading)]">{reason.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                        {reason.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How we operate */}
      <section className="section-pad bg-section">
        <div className="container-ar">
          <PageHero
            eyebrow="Operations"
            title="How we operate"
            description="UK governance. Nigerian member care. Clear processes from deposit to settlement."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {operations.map((item, index) => {
              const Icon = OPERATION_ICONS[index % OPERATION_ICONS.length];
              return (
                <Card key={item.title} variant="outline" className="h-full bg-[var(--surface-raised)]/60">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
                    <Icon size={18} aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold text-[var(--heading)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar">
          <PageHero
            eyebrow="Leadership"
            title="People behind the platform"
            description="International governance with a Nigeria-first operations team."
            align="center"
            className="mx-auto"
          />
          <div className="mx-auto mt-8 grid max-w-4xl gap-6 md:grid-cols-2">
            {leadership.map((person, index) => (
              <Card key={person.name} variant="elevated" padding="lg" className="h-full">
                <div
                  className={cn(
                    "inline-flex size-12 items-center justify-center rounded-2xl",
                    index === 0
                      ? "bg-[var(--navy)] text-white"
                      : "bg-[var(--emerald-soft)] text-[var(--emerald)]"
                  )}
                >
                  {index === 0 ? <Building2 size={22} aria-hidden /> : <Users size={22} aria-hidden />}
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
                  {person.role}
                </p>
                <h3 className="mt-2 text-xl font-bold text-[var(--heading)]">{person.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{person.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-pad bg-section">
        <div className="container-ar">
          <PageHero
            eyebrow="Journey"
            title="Our path so far"
            description="A focused timeline — from founding to serving members across Nigeria."
            align="center"
            className="mx-auto"
          />
          <div className="relative mt-14">
            <div
              className="pointer-events-none absolute left-0 right-0 top-4 hidden h-px bg-gradient-to-r from-[var(--gold)]/40 via-[var(--border-strong)] to-[var(--emerald)]/40 md:block"
              aria-hidden
            />
            <ol className="relative grid gap-8 md:grid-cols-5 md:gap-4">
              {timeline.map((item, index) => (
                <li key={item.label} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                  <span className="relative z-[1] mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-[var(--surface-raised)] text-xs font-bold text-[var(--gold)] md:mt-0">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[var(--heading)]">{item.label}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)] md:mt-2">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-y border-[var(--border)] bg-[var(--navy)] section-pad-sm">
        <div className="container-ar">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center sm:text-left lg:text-center">
                <p className="text-lg font-bold text-white sm:text-xl">{stat.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-white/55">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-hero relative overflow-hidden section-pad-hero">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.12),transparent_50%)]"
          aria-hidden
        />
        <div className="container-ar relative max-w-3xl text-center">
          <SectionEyebrow className="justify-center text-center">Get started</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl">
            {cta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            {cta.description}
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="/auth/register" className="sm:min-w-[11rem]">
              <Button size="lg" className="h-13 w-full gap-2 shadow-[var(--shadow-glow)]">
                {cta.primary}
                <ArrowRight size={18} aria-hidden />
              </Button>
            </Link>
            <Link href="/packages" className="sm:min-w-[14rem]">
              <Button size="lg" variant="secondary" className="h-13 w-full">
                {cta.secondary}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
