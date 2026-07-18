import Link from "next/link";
import { COMPANY } from "@/lib/company";
import { BrandLogoStatic } from "@/components/brand/BrandLogoStatic";
import { OfficialSocialLinks } from "@/components/social/OfficialSocialLinks";
import { footerLinks } from "@/content/navigation";

export function SiteFooter() {
  return (
    <footer className="gradient-navy text-white">
      <div className="container-ar section-pad-sm">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandLogoStatic variant="full" href="/" />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">{COMPANY.tagline}</p>
            <p className="mt-3 text-xs text-white/50">
              {COMPANY.legalName} · Co. {COMPANY.companyNumber}
              <br />
              {COMPANY.addressFull}
              <br />
              Operations: {COMPANY.nigeriaOffice}
              <br />
              <a href={`mailto:${COMPANY.supportEmail}`} className="text-white/70 hover:text-white">
                {COMPANY.supportEmail}
              </a>
            </p>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gold-light)]">Follow us</p>
              <OfficialSocialLinks variant="onDark" size="sm" className="mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-3">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--gold-light)]">{title}</h4>
                <ul className="mt-3 space-y-1.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-white/70 transition hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/legal/cookies" className="hover:text-white">
              Cookies
            </Link>
            <Link href="/legal/complaints" className="hover:text-white">
              Complaints
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
