import { LearnArticleView } from "@/components/learn/LearnArticleView";

type Props = { params: Promise<{ slug: string }> };

export default async function LearnArticlePage({ params }: Props) {
  const { slug } = await params;
  return <LearnArticleView slug={slug} />;
}
