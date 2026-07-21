import type { ComplianceDocument } from "./types";

export const COMPLIANCE_DOCUMENTS: ComplianceDocument[] = [
  {
    id: "terms",
    title: "Terms & Conditions",
    href: "/legal/terms",
    summary: "Membership rules, platform use, and cooperative participation terms.",
    category: "legal",
    searchableText: "terms conditions membership agreement cooperative rules"
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    href: "/legal/privacy",
    summary: "How we collect, use, and protect your personal information.",
    category: "policy",
    searchableText: "privacy personal data cookies processing"
  },
  {
    id: "aml",
    title: "AML Policy",
    href: "/legal/aml",
    summary: "Anti-money laundering controls and member obligations.",
    category: "policy",
    searchableText: "aml anti money laundering verification suspicious activity"
  },
  {
    id: "kyc",
    title: "KYC Policy",
    href: "/legal/kyc",
    summary: "Identity verification requirements and document standards.",
    category: "policy",
    searchableText: "kyc know your customer identity verification documents"
  },
  {
    id: "risk",
    title: "Risk Disclosure",
    href: "/legal/risk",
    summary: "Investment risks, market uncertainty, and member responsibilities.",
    category: "legal",
    searchableText: "risk disclosure investment loss liquidity market operational"
  },
  {
    id: "complaints",
    title: "Complaint Handling",
    href: "/legal/complaints",
    summary: "How to raise concerns and our resolution process.",
    category: "policy",
    searchableText: "complaints dispute resolution support escalation"
  },
  {
    id: "cookies",
    title: "Cookie Policy",
    href: "/legal/cookies",
    summary: "Cookies and similar technologies used on our website.",
    category: "policy",
    searchableText: "cookies tracking analytics preferences"
  },
  {
    id: "security",
    title: "Security Policy",
    href: "/legal/security",
    summary: "Platform security practices and member security expectations.",
    category: "policy",
    searchableText: "security encryption authentication fraud protection"
  },
  {
    id: "data-protection",
    title: "Data Protection",
    href: "/privacy",
    summary: "Member privacy centre — understand and manage your data.",
    category: "policy",
    searchableText: "data protection gdpr rights deletion download export"
  },
  {
    id: "regulatory-notices",
    title: "Regulatory Notices",
    href: "/compliance#regulatory-notices",
    summary: "Future regulatory updates and official notices will appear here.",
    category: "notice",
    searchableText: "regulatory notice update compliance official"
  }
];

export function searchComplianceDocuments(query: string): ComplianceDocument[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMPLIANCE_DOCUMENTS;
  return COMPLIANCE_DOCUMENTS.filter(
    (doc) =>
      doc.title.toLowerCase().includes(q) ||
      doc.summary.toLowerCase().includes(q) ||
      doc.searchableText.toLowerCase().includes(q)
  );
}
