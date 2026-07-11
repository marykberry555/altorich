import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { DownloadAppButton } from "@/components/pwa/DownloadAppButton";
import { hero, investmentCategories, howItWorks, trustIndicators, sampleTestimonials, faqs } from "@/content/site";
import { PageHero } from "@/components/marketing/PageHero";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PackageCard } from "@/components/marketing/PackageCard";
import { TestimonialsMarquee } from "@/components/marketing/TestimonialsMarquee";
import { WeeklyCountdown } from "@/components/roi/WeeklyCountdown";
import { StepNumber } from "@/components/ui/StepNumber";

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="gradient-hero section-pad">
        <div className="container-ar grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-up">
            <Badge variant="emerald">{hero.eyebrow}</Badge>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[var(--heading)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {hero.title}
            </h1>
            <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-[var(--heading)]/80 sm:text-lg">
              {hero.subtitle}
            </p>
            {"guarantee" in hero && hero.guarantee ? (
              <p className="mt-2 text-sm font-semibold text-[var(--emerald)]">{hero.guarantee}</p>
            ) : null}
            <div className="mt-6">
              <WeeklyCountdown />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/auth/register">
                <Button size="lg" className="shadow-[var(--shadow-glow)]">
                  {hero.ctaPrimary} <ArrowRight size={18} />
                </Button>
              </Link>
              <DownloadAppButton variant="outline" size="lg" label="Download App" />
              <Link href="/learn/how-it-works">
                <Button variant="outline" size="lg">
                  {hero.ctaSecondary}
                </Button>
              </Link>
            </div>
            {/* Intentionally minimal: no trust microcopy in hero */}
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]">
              <Image
                src={IMAGES.hero.src}
                alt={IMAGES.hero.alt}
                width={800}
                height={600}
                className="h-[420px] w-full object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Investment categories */}
      <section className="section-pad bg-section">
        <div className="container-ar">
          <PageHero eyebrow="Products" title="What you can invest in" description="Pick a structured plan or savings pool that matches your goal and timeline." />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {investmentCategories.map((cat) => (
              <PackageCard key={cat.slug} pkg={cat} compact />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar">
          <PageHero eyebrow="How it works" title="Simple, verifiable, auditable" align="center" className="mx-auto" />
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

      {/* Trust */}
      <section className="gradient-navy section-pad text-white">
        <div className="container-ar grid gap-10 lg:grid-cols-2">
          <PageHero dark eyebrow="Security & governance" title="Built on verification, not promises." description="Every funding request is reconciled against real bank transfers. Every payout follows published windows. Weekly returns from 10% to 25% are guaranteed and paid every Monday at 09:00 WAT." />
          <div className="grid gap-4 sm:grid-cols-2">
            {trustIndicators.map((item) => (
              <div key={item.label} className="rounded-[var(--radius)] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wider text-white/50">{item.label}</p>
                <p className="mt-2 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-pad bg-[var(--gold-soft)]">
        <div className="container-ar">
          <PageHero eyebrow="Member voices" title="What members say" align="center" className="mx-auto" />
          <div className="mt-10">
            <TestimonialsMarquee
              items={sampleTestimonials.map((t) => ({ name: t.name, role: t.role, quote: t.quote }))}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
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

      {/* CTA */}
      <section className="section-pad bg-[var(--emerald-soft)]">
        <div className="container-ar text-center">
          <h2 className="text-3xl font-bold text-[var(--heading)]">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-lg text-[var(--text-muted)]">Create your account, fund your wallet, and choose a plan that fits your timeline.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/auth/register">
              <Button size="lg" className="shadow-[var(--shadow-glow)]">Get Started</Button>
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