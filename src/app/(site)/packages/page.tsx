import Image from "next/image";
import { investmentCategories } from "@/content/site";
import { PACKAGE_IMAGES } from "@/lib/images";
import { PageHero } from "@/components/marketing/PageHero";
import { PackageCard } from "@/components/marketing/PackageCard";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Packages — Structured investment pools",
  description:
    "Four disciplined cooperative pools — from savings locks to hard-currency assets. Yields and rates are visible only after sign-in.",
  path: "/packages"
});

export default function PackagesIndexPage() {
  return (
    <>
      <section className="gradient-hero section-pad">
        <div className="container-ar grid items-center gap-10 lg:grid-cols-2">
          <PageHero
            eyebrow="Packages"
            title="Structured pools for every stage of wealth building"
            description="AltoRich packages map to real sectors — savings, agriculture, property, and hard currency. Each pool follows published rules, verified contributions, and auditable ledger records."
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
            {investmentCategories.map((pkg) => (
              <PackageCard key={pkg.slug} pkg={pkg} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
