import Link from "next/link";
import { ArrowRight, BookOpen, ListChecks } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LEARN_ARTICLES } from "@/content/learn";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Learn — Financial education",
  description:
    "How AltoRich works, common questions, and plain-language guides on investing with transparent records.",
  path: "/learn"
});

const platformGuides = [
  {
    href: "/learn/how-it-works",
    title: "How it works",
    description: "From registration to wallet funding, package selection, and payout cycles.",
    icon: ListChecks
  },
  {
    href: "/learn/faq",
    title: "FAQs",
    description: "Answers on verification, wallet funding, payout windows, and account security.",
    icon: BookOpen
  },
  {
    href: "/learn/glossary",
    title: "Glossary",
    description: "Plain-language definitions for investment, wallet, and compliance terms used on AltoRich.",
    icon: BookOpen
  }
];

const educationArticles = LEARN_ARTICLES.filter((article) => article.slug !== "glossary");

export default function LearnPage() {
  return (
    <>
      <section className="gradient-hero section-pad-hero">
        <div className="container-ar">
          <PageHero
            eyebrow="Learn"
            title="Clear guides for verified members and prospective investors"
            description="Understand how AltoRich handles investment funding, cycles, and ledger records before you activate a package."
          />
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar">
          <h2 className="text-xl font-bold text-[var(--heading)]">Platform guides</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {platformGuides.map((item) => (
              <Card key={item.href} variant="elevated" className="flex flex-col">
                <item.icon className="text-[var(--emerald)]" size={28} />
                <h3 className="mt-4 text-lg font-semibold text-[var(--heading)]">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">{item.description}</p>
                <Link href={item.href} className="mt-6">
                  <Button variant="outline" size="sm">
                    Read more <ArrowRight size={16} />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar">
          <h2 className="text-xl font-bold text-[var(--heading)]">Financial education</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
            Long-form articles on saving, investing, and building wealth in Nigeria — written for clarity, not hype.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {educationArticles.map((article) => (
              <Card key={article.slug} variant="elevated" className="flex flex-col">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--emerald)]">{article.category}</p>
                <h3 className="mt-2 font-semibold text-[var(--heading)]">{article.title}</h3>
                <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">{article.description}</p>
                <p className="mt-3 text-xs text-[var(--text-subtle)]">{article.readMinutes} min read</p>
                <Link href={article.path} className="mt-4">
                  <Button variant="ghost" size="sm" className="px-0">
                    Read article <ArrowRight size={16} />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
