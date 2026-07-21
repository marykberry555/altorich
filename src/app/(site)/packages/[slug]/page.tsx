import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PackageDetailPage } from "@/components/marketing/PackageDetailPage";
import { getPackage, packageList } from "@/content/packages";
import { buildMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return packageList.map((pkg) => ({ slug: pkg.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pkg = getPackage(slug);
  if (!pkg) return { title: "Package not found" };
  return buildMetadata({
    title: `${pkg.title} · ${pkg.subtitle}`,
    description: pkg.heroHeadline,
    path: `/packages/${slug}`
  });
}

export default async function PackagePage({ params }: Props) {
  const { slug } = await params;
  const pkg = getPackage(slug);
  if (!pkg) notFound();

  return <PackageDetailPage pkg={pkg} />;
}
