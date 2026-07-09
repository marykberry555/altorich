import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { mission, vision, values, leadership } from "@/content/site";
import { COMPANY, REGULATORY_PLACEHOLDER } from "@/lib/company";
import Image from "next/image";
import { IMAGES } from "@/lib/images";

export default function AboutPage() {
  return (
    <>
      <section className="gradient-hero section-pad">
        <div className="container-ar">
          <PageHero
            eyebrow="About AltoRich"
            title="A wealth platform built on verification and transparent records."
            description={`${COMPANY.legalName} (Company No. ${COMPANY.companyNumber}) operates AltoRich with published rules, auditable ledgers, and clear member processes.`}
          />
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar grid items-center gap-12 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
            <Image
              src={IMAGES.about.src}
              alt={IMAGES.about.alt}
              width={800}
              height={500}
              className="h-[360px] w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--heading)]">{mission.title}</h2>
            <p className="mt-4 leading-relaxed text-[var(--text-muted)]">{mission.body}</p>
            <h2 className="mt-8 text-2xl font-bold text-[var(--heading)]">{vision.title}</h2>
            <p className="mt-4 text-[var(--text-muted)] leading-relaxed">{vision.body}</p>
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar">
          <PageHero eyebrow="Values" title="What we stand for" align="center" className="mx-auto" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <Card key={v.title} variant="elevated">
                <h3 className="font-semibold text-[var(--heading)]">{v.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{v.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar">
          <PageHero eyebrow="Governance" title="Corporate responsibility" />
          <Card variant="outline" className="mt-6 border-amber-200 bg-amber-50">
            <p className="text-sm text-amber-900">
              <strong>Regulatory disclosure placeholder:</strong> {REGULATORY_PLACEHOLDER}
            </p>
          </Card>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {leadership.map((person) => (
              <Card key={person.name} variant="elevated">
                <h3 className="font-semibold text-[var(--heading)]">{person.name}</h3>
                <p className="text-sm text-[var(--emerald)]">{person.role}</p>
                <p className="mt-3 text-sm text-[var(--text-muted)]">{person.bio}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/contact">
              <Button>Contact our team</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
