import { PACKAGE_CONFIG } from "@/lib/packages/package-config";

export type NavLink = { label: string; href: string };

export const portfolioNav: NavLink[] = PACKAGE_CONFIG.map((pkg) => ({
  label: `${pkg.title} · ${pkg.dailyReturnPercent}%`,
  href: `/packages/${pkg.slug}`
}));

/** Footer portfolio links — name only, no daily-return suffix. */
export const footerPortfolioNav: NavLink[] = PACKAGE_CONFIG.map((pkg) => ({
  label: pkg.title,
  href: `/packages/${pkg.slug}`
}));

/** @deprecated Use portfolioNav */
export const packageNav = portfolioNav;

export type HeaderNavItem =
  | { label: string; href: string; children?: undefined }
  | { label: string; href: string; children: NavLink[] };

export const headerNav: HeaderNavItem[] = [
  { label: "Portfolios", href: "/packages", children: portfolioNav },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" }
];

export const footerLinks: Record<string, NavLink[]> = {
  Portfolios: [{ label: "All portfolios", href: "/packages" }, ...footerPortfolioNav],
  Company: [
    { label: "Download app", href: "/download" },
    { label: "About", href: "/about" },
    { label: "Knowledge Center", href: "/learn" },
    { label: "Transparency", href: "/company/transparency" },
    { label: "Leadership", href: "/company/leadership" },
    { label: "Security Center", href: "/company/security" },
    { label: "Compliance Hub", href: "/compliance" },
    { label: "System status", href: "/status" },
    { label: "Contact", href: "/contact" },
    { label: "How it works", href: "/how-it-works" },
    { label: "FAQ Centre", href: "/learn/faq" },
    { label: "Glossary", href: "/learn/glossary" }
  ],
  Legal: [
    { label: "Compliance Hub", href: "/compliance" },
    { label: "Security Center", href: "/company/security" },
    { label: "Business continuity", href: "/business-continuity" },
    { label: "Terms", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Risk disclosure", href: "/legal/risk" },
    { label: "AML policy", href: "/legal/aml" },
    { label: "KYC policy", href: "/legal/kyc" }
  ]
};
