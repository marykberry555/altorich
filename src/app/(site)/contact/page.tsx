import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { branches } from "@/content/site";
import { PageHero } from "@/components/marketing/PageHero";
import { ContactForm } from "@/components/marketing/ContactForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { COMPANY } from "@/lib/company";

export default function ContactPage() {
  return (
    <>
      <section className="gradient-hero section-pad">
        <div className="container-ar">
          <PageHero
            eyebrow="Contact"
            title="Reach our team in Lagos and London"
            description="Member support operates on West Africa Time. For account-specific issues, log in and use your dashboard — it helps us resolve matters faster."
          />
          <div className="mt-10 flex justify-center">
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
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              {branches.map((branch) => (
                <Card key={branch.city} variant="elevated">
                  <h3 className="font-semibold text-[var(--heading)]">{branch.city}</h3>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{branch.address}</p>
                  <a
                    href={`mailto:${branch.phone}`}
                    className="mt-3 inline-block text-sm text-[var(--emerald)] hover:underline"
                  >
                    {branch.phone}
                  </a>
                </Card>
              ))}
            </div>
          </div>

          <Card variant="outline" className="mt-10">
            <h2 className="font-semibold text-[var(--heading)]">Before you write</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Many questions are answered in our help centre and FAQs. For deposit or withdrawal issues, include your
              transfer reference and registered phone number.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/learn/faq">
                <Button variant="outline" size="sm">Help centre</Button>
              </Link>
              <Link href="/learn/faq">
                <Button variant="outline" size="sm">FAQs</Button>
              </Link>
              <Link href="/legal/complaints">
                <Button variant="outline" size="sm">Complaints procedure</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
