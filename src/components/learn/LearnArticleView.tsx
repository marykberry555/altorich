import Link from "next/link";
import { notFound } from "next/navigation";
import { getLearnArticle, LEARN_ARTICLES } from "@/content/learn";
import { buildMetadata } from "@/lib/seo";
import { IMAGES } from "@/lib/images";
import Image from "next/image";

export function generateLearnStaticParams() {
  return LEARN_ARTICLES.map((a) => ({ slug: a.slug }));
}

export function generateLearnMetadata(slug: string) {
  const article = getLearnArticle(slug);
  if (!article) return {};
  return buildMetadata({
    title: article.title,
    description: article.description,
    path: article.path,
    type: "article"
  });
}

export function LearnArticleView({ slug }: { slug: string }) {
  const article = getLearnArticle(slug);
  if (!article) notFound();

  return (
    <>
      <article className="section-pad">
        <div className="container-ar">
          <nav className="text-sm text-[var(--text-subtle)]" aria-label="Breadcrumb">
            <Link href="/learn" className="hover:text-[var(--emerald)]">
              Learn
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--text-muted)]">{article.category}</span>
          </nav>

          <header className="mt-6 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--emerald)]">{article.category}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text)] md:text-4xl">{article.title}</h1>
            <p className="mt-4 text-lg text-[var(--text-muted)]">{article.description}</p>
            <p className="mt-3 text-sm text-[var(--text-subtle)]">{article.readMinutes} min read</p>
          </header>

          <div className="relative mt-10 aspect-[21/9] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
            <Image src={IMAGES.learn.src} alt={IMAGES.learn.alt} fill className="object-cover" sizes="(max-width: 1200px) 100vw, 1200px" priority />
          </div>

          <div className="prose-ar mx-auto mt-12 max-w-3xl">
            {article.sections.map((section) => (
              <section key={section.heading} className="mb-10">
                <h2>{section.heading}</h2>
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </section>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-6">
            <p className="text-sm text-[var(--text-muted)]">
              This content is educational and not personal financial advice. Review plan terms and risk disclosures before investing.{" "}
              <Link href="/legal/risk" className="font-medium text-[var(--emerald)] hover:underline">
                Risk disclosure
              </Link>
            </p>
          </div>
        </div>
      </article>
    </>
  );
}
