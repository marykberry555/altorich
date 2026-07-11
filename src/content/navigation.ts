export type NavLink = { label: string; href: string };

export const packageNav: NavLink[] = [
  { label: "Alto Starter", href: "/packages/starter" },
  { label: "Alto Growth", href: "/packages/growth" },
  { label: "Alto Premium", href: "/packages/premium" },
  { label: "Alto Elite", href: "/packages/elite" }
];

export type HeaderNavItem =
  | { label: string; href: string; children?: undefined }
  | { label: string; href: string; children: NavLink[] };

export const headerNav: HeaderNavItem[] = [
  { label: "Packages", href: "/packages", children: packageNav },
  { label: "How it works", href: "/learn/how-it-works" },
  { label: "Learn", href: "/learn" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" }
];

export const footerLinks: Record<string, NavLink[]> = {
  Packages: [{ label: "All packages", href: "/packages" }, ...packageNav],
  Company: [
    { label: "Download app", href: "/download" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "How it works", href: "/learn/how-it-works" },
    { label: "FAQs", href: "/learn/faq" },
    { label: "Glossary", href: "/learn/glossary" }
  ],
  Legal: [
    { label: "Terms", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Risk disclosure", href: "/legal/risk" },
    { label: "AML policy", href: "/legal/aml" },
    { label: "KYC policy", href: "/legal/kyc" }
  ]
};
