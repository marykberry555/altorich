import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  process: { title: string; description: string }[];
  risks: string[];
  eligibility: string[];
  imageAlt: string;
  imageSrc: string;
  ctaHref?: string;
};

export function SolutionPage({
  eyebrow,
  title,
  description,
  highlights,
  process,
  risks,
  eligibility,
  imageAlt,
  imageSrc,
  ctaHref = "/auth/register"
}: Props) {
  return (
    <>
      <section className="gradient-hero section-pad-hero">
        <div className="container-ar grid items-center gap-10 lg:grid-cols-2">
          <PageHero eyebrow={eyebrow} title={title} description={description} />
          <div className="overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]">
            <Image src={imageSrc} alt={imageAlt} width={800} height={500} className="h-[320px] w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-[var(--heading)]">Key benefits</h2>
            <ul className="mt-4 space-y-3">
              {highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-[var(--text-muted)]">
                  <span className="text-[var(--emerald)]">✓</span> {h}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--navy)]">Eligibility</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
              {eligibility.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar">
          <h2 className="text-2xl font-bold text-[var(--navy)]">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {process.map((step, i) => (
              <Card key={step.title} variant="elevated">
                <span className="text-sm font-bold text-[var(--emerald)]">Step {i + 1}</span>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar max-w-3xl">
          <h2 className="text-2xl font-bold text-[var(--navy)]">Risk considerations</h2>
          <Card variant="outline" className="mt-4 border-amber-200 bg-amber-50">
            <ul className="space-y-2 text-sm text-amber-950">
              {risks.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </Card>
          <div className="mt-8">
            <Link href={ctaHref}>
              <Button size="lg" className="shadow-[var(--shadow-glow)]">
                Get Started <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
