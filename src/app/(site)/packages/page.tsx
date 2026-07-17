import { PACKAGE_CONFIG } from "@/lib/packages/package-config";
import { PACKAGE_IMAGES } from "@/lib/images";
import { PageHero } from "@/components/marketing/PageHero";
import { PackageCard } from "@/components/marketing/PackageCard";
import { buildMetadata } from "@/lib/seo";
import Image from "next/image";

export const metadata = buildMetadata({
  title: "Investment sectors — Choose Your Investment Sector",
  description:
    "Four professionally managed investment sectors. One Platform Earning Model — up to 5% daily.",
  path: "/packages"
});

export default function PackagesIndexPage() {
  const packages = PACKAGE_CONFIG.map((pkg) => ({
    slug: pkg.slug,
    title: pkg.title,
    subtitle: pkg.subtitle,
    description: pkg.cardDescription,
    href: `/packages/${pkg.slug}`,
    image: pkg.image,
    keyBenefits: pkg.keyBenefits,
    bestFor: pkg.bestFor,
    ctaLabel: pkg.ctaLabel
  }));

  return (
    <>
      <section className="gradient-hero section-pad">
        <div className="container-ar grid items-center gap-10 lg:grid-cols-2">
          <PageHero
            eyebrow="Investment sectors"
            title="Choose Your Investment Sector"
            description="Diversify your wealth across professionally managed investment sectors while earning through Alto Rich's unified Platform Earning Model."
          />
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-lg)]">
            <Image
              src={PACKAGE_IMAGES.all.src}
              alt={PACKAGE_IMAGES.all.alt}
              width={800}
              height={520}
              className="h-[280px] w-full object-cover sm:h-[340px]"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar">
          <div className="grid gap-6 sm:grid-cols-2">
            {packages.map((pkg) => (
              <PackageCard key={pkg.slug} pkg={pkg} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
