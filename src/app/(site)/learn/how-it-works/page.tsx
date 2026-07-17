import Link from "next/link";
import { howItWorks } from "@/content/site";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StepNumber } from "@/components/ui/StepNumber";

export default function HowItWorksPage() {
  return (
    <>
      <section className="gradient-hero section-pad-hero">
        <div className="container-ar">
          <PageHero
            eyebrow="How it works"
            title="Four steps from signup to transparent wealth tracking"
            description="AltoRich is built around verified bank transfers and ledger-based records — so you always know where your money stands."
          />
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step) => (
              <Card key={step.step} variant="elevated">
                <StepNumber value={step.step} size="lg" />
                <h2 className="mt-3 font-semibold text-[var(--heading)]">{step.title}</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{step.description}</p>
              </Card>
            ))}
          </div>

          <Card variant="outline" className="mt-8 border-amber-200 bg-amber-50">
            <p className="text-sm text-amber-950">
              <strong>Important:</strong> Deposits are credited only after an administrator verifies your bank transfer
              against our receiving account. Never send money without submitting your transfer reference in the dashboard.
            </p>
          </Card>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/register">
              <Button size="lg" className="shadow-[var(--shadow-glow)]">Get Started</Button>
            </Link>
            <Link href="/packages">
              <Button variant="outline" size="lg">View packages</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
