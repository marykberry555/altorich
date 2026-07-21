import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { OFFICE_LOCATIONS } from "@/content/leadership";
import { PageHero } from "@/components/marketing/PageHero";
import { ContactForm } from "@/components/marketing/ContactForm";
import { OfficialSocialLinks } from "@/components/social/OfficialSocialLinks";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { COMPANY } from "@/lib/company";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact Alto Rich",
  description:
    "Reach member support and corporate teams across Lagos, London, and regional offices. For account issues, sign in to your dashboard for faster resolution.",
  path: "/contact"
});

export default function ContactPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <section className="gradient-hero section-pad-hero">
        <div className="container-ar">
          <PageHero
            eyebrow="Contact"
            title="Reach our team across four offices"
            description="Member support operates on West Africa Time from Lagos. Corporate governance is led from London. For account-specific issues, log in and use your dashboard — it helps us resolve matters faster."
          />
          <div className="mt-8 flex justify-center">
            <ContactForm />
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card variant="elevated" className="lg:col-span-1">
              <h2 className="font-semibold text-[var(--heading)]">General enquiries</h2>
              <ul className="mt-4 space-y-4 text-sm text-[var(--text-muted)]">
                <li className="flex gap-3">
                  <Mail className="shrink-0 text-[var(--emerald)]" size={18} />
                  <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-[var(--heading)]">
                    {COMPANY.supportEmail}
                  </a>
                </li>
                <li className="flex gap-3">
                  <MapPin className="shrink-0 text-[var(--emerald)]" size={18} />
                  <span>{COMPANY.addressFull}</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-[var(--text-muted)]">
                {COMPANY.legalName} · Company No. {COMPANY.companyNumber}
              </p>
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <h3 className="text-sm font-semibold text-[var(--heading)]">Follow us</h3>
                <OfficialSocialLinks className="mt-3" size="sm" />
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              {OFFICE_LOCATIONS.map((office) => (
                <Card key={office.city} variant="elevated">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">{office.role}</p>
                  <h3 className="mt-1 font-semibold text-[var(--heading)]">
                    {office.city}
                    <span className="ml-1.5 text-sm font-normal text-[var(--text-muted)]">· {office.country}</span>
                  </h3>
                  <p className="mt-2 flex items-start gap-2 text-sm text-[var(--text-muted)]">
                    <MapPin className="mt-0.5 shrink-0 text-[var(--emerald)]" size={14} aria-hidden />
                    {office.address}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{office.supportCoverage}</p>
                  <a
                    href={`mailto:${COMPANY.supportEmail}`}
                    className="mt-3 inline-block text-sm text-[var(--emerald)] hover:underline"
                  >
                    {COMPANY.supportEmail}
                  </a>
                </Card>
              ))}
            </div>
          </div>

          <Card variant="outline" className="mt-8">
            <h2 className="font-semibold text-[var(--heading)]">Before you write</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Many questions are answered in our help centre and FAQs. For deposit or withdrawal issues, include your
              transfer reference and registered phone number. You can also join the Alto Rich community on Facebook
              and WhatsApp.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/learn">
                <Button variant="outline" size="sm">Knowledge Center</Button>
              </Link>
              <Link href="/learn/faq">
                <Button variant="outline" size="sm">FAQs</Button>
              </Link>
              <Link href="/company/leadership">
                <Button variant="outline" size="sm">Leadership</Button>
              </Link>
              <Link href="/legal/complaints">
                <Button variant="outline" size="sm">Complaints procedure</Button>
              </Link>
            </div>
            <OfficialSocialLinks className="mt-5" size="sm" />
          </Card>
        </div>
      </section>
    </>
  );
}
