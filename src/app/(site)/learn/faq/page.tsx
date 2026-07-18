import Link from "next/link";
import { faqs } from "@/content/site";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQs — Common questions",
  description:
    "Straight answers on registration, wallet funding, returns, and Monday 09:00 WAT withdrawals for Alto Rich members.",
  path: "/learn/faq"
});

export default function FaqPage() {
  return (
    <>
      <section className="gradient-hero section-pad-hero">
        <div className="container-ar max-w-3xl">
          <PageHero
            eyebrow="FAQs"
            title="Common questions from Nigerian members"
            description="Straight answers on registration, wallet funding, returns, and withdrawals — no marketing spin."
          />
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar max-w-3xl space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.q} variant="elevated">
              <h2 className="font-semibold text-[var(--heading)]">{faq.q}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{faq.a}</p>
            </Card>
          ))}

          <div className="pt-6 flex flex-wrap gap-3">
            <Link href="/contact">
              <Button variant="outline">Visit help centre</Button>
            </Link>
            <Link href="/contact">
              <Button>Still need help?</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
