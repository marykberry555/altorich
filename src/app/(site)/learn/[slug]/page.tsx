import { LearnArticleView, generateLearnStaticParams, generateLearnMetadata } from "@/components/learn/LearnArticleView";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

/** Reserved for dedicated static pages under /learn/* — never resolve via [slug]. */
const RESERVED_LEARN_SLUGS = new Set(["faq", "how-it-works", "help"]);

export function generateStaticParams() {
  return generateLearnStaticParams();
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (RESERVED_LEARN_SLUGS.has(slug)) return {};
  return generateLearnMetadata(slug);
}

export default async function LearnArticlePage({ params }: Props) {
  const { slug } = await params;

  if (slug === "help" || slug === "faq") {
    redirect("/learn/faq");
  }
  if (slug === "how-it-works") {
    redirect("/learn/how-it-works");
  }

  return <LearnArticleView slug={slug} />;
}
