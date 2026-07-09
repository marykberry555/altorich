import { PageHero } from "@/components/marketing/PageHero";

type Props = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalDocument({ title, lastUpdated, children }: Props) {
  return (
    <section className="section-pad">
      <div className="container-ar max-w-3xl">
        <PageHero eyebrow="Legal" title={title} description={`Last updated: ${lastUpdated}`} />
        <div className="prose-ar mt-10">{children}</div>
      </div>
    </section>
  );
}
