import type { KnowledgeArticle } from "./types";

const UPDATED = "2026-07-01";

function article(
  partial: Omit<KnowledgeArticle, "path" | "readMinutes"> & { readMinutes?: number }
): KnowledgeArticle {
  const words = partial.sections.reduce(
    (n, s) =>
      n +
      (s.paragraphs?.join(" ").split(/\s+/).length ?? 0) +
      (s.blocks?.reduce((b, bl) => b + (bl.type === "paragraph" ? bl.text.split(/\s+/).length : 20), 0) ?? 0),
    0
  );
  return {
    ...partial,
    path: `/learn/${partial.slug}`,
    readMinutes: partial.readMinutes ?? Math.max(3, Math.ceil(words / 200))
  };
}

export const SECURITY_ARTICLES: KnowledgeArticle[] = [
  article({
    slug: "strong-passwords",
    title: "Creating Strong Passwords",
    description: "Build passwords that protect your Alto Rich account and personal finances.",
    category: "Security Academy",
    categorySlug: "security",
    keywords: ["password", "credentials", "security"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["protect-email", "account-security-overview"],
    sections: [
      {
        heading: "Password principles",
        blocks: [
          {
            type: "best-practice",
            text: "Use at least 12 characters mixing letters, numbers, and symbols."
          },
          {
            type: "best-practice",
            text: "Never reuse your Alto Rich password on other websites."
          },
          {
            type: "best-practice",
            text: "Consider a reputable password manager to generate and store unique passwords."
          }
        ]
      }
    ]
  }),
  article({
    slug: "protect-email",
    title: "Protecting Your Email",
    description: "Your email is the key to account recovery — keep it secure.",
    category: "Security Academy",
    categorySlug: "security",
    keywords: ["email", "recovery", "2fa"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["email-verification", "strong-passwords", "phishing-awareness"],
    sections: [
      {
        heading: "Why email security matters",
        paragraphs: [
          "Password resets and security alerts go to your registered email. If someone accesses your email, they may attempt to take over financial accounts linked to it."
        ],
        blocks: [{ type: "tip", text: "Enable two-factor authentication on your email provider when available." }]
      }
    ]
  }),
  article({
    slug: "phishing-awareness",
    title: "Recognising Phishing Attempts",
    description: "Spot fake messages, fraudulent links, and social engineering targeting investors.",
    category: "Security Academy",
    categorySlug: "security",
    keywords: ["phishing", "scam", "fraud", "fake"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["report-suspicious", "protect-email"],
    sections: [
      {
        heading: "Common signs",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Urgent language", description: '"Act now or lose access" — legitimate services rarely pressure you this way.' },
              { title: "Wrong sender", description: "Check the full email address, not just the display name." },
              { title: "Suspicious links", description: "Hover before clicking. Official links use altorich.com domains." },
              { title: "Requests for secrets", description: "Alto Rich never asks for your password or PIN by email or SMS." }
            ]
          }
        ]
      },
      {
        heading: "What to do",
        blocks: [{ type: "warning", title: "If in doubt", text: "Do not click. Sign in directly via the official website and check your account status." }]
      }
    ]
  }),
  article({
    slug: "account-security",
    title: "Keeping Your Account Secure",
    description: "Daily habits that reduce the risk of unauthorised access to your member account.",
    category: "Security Academy",
    categorySlug: "security",
    keywords: ["account", "secure", "habits"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["device-security", "strong-passwords"],
    sections: [
      {
        heading: "Security checklist",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Review login activity", description: "Check Settings regularly for unfamiliar sign-ins." },
              { title: "Sign out on shared devices", description: "Never stay logged in on public computers." },
              { title: "Update bank details carefully", description: "Verify changes through official channels only." },
              { title: "Report anomalies immediately", description: "Contact support if you notice unexpected transactions." }
            ]
          }
        ]
      }
    ]
  }),
  article({
    slug: "safe-banking",
    title: "Safe Banking Practices Online",
    description: "Protect your bank transfers, account numbers, and withdrawal destinations.",
    category: "Security Academy",
    categorySlug: "security",
    keywords: ["bank", "transfer", "withdrawal", "safe"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["withdrawals-guide", "account-security"],
    sections: [
      {
        heading: "Transfer safety",
        paragraphs: [
          "Only transfer to receiving accounts shown inside your authenticated Alto Rich dashboard. Verify account numbers character by character before sending."
        ],
        blocks: [{ type: "warning", text: "Scammers may share fake account details via WhatsApp or social media. Always confirm in your dashboard." }]
      }
    ]
  }),
  article({
    slug: "device-security",
    title: "Device Security",
    description: "Secure your phone and computer when accessing financial accounts.",
    category: "Security Academy",
    categorySlug: "security",
    keywords: ["device", "phone", "computer", "mobile"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["account-security", "strong-passwords"],
    sections: [
      {
        heading: "Device hygiene",
        blocks: [
          {
            type: "best-practice",
            text: "Keep your operating system and browser updated."
          },
          {
            type: "best-practice",
            text: "Use screen lock / biometric unlock on mobile devices."
          },
          {
            type: "best-practice",
            text: "Avoid installing apps from unknown sources."
          }
        ]
      }
    ]
  }),
  article({
    slug: "two-factor-auth",
    title: "Two-Factor Authentication (Coming Soon)",
    description: "How an extra verification step will strengthen account security when enabled.",
    category: "Security Academy",
    categorySlug: "security",
    keywords: ["2fa", "two factor", "authentication", "otp"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["protect-email", "account-security"],
    sections: [
      {
        heading: "What is 2FA?",
        paragraphs: [
          "Two-factor authentication requires something you know (password) plus something you have (phone or authenticator app). This significantly reduces account takeover risk."
        ],
        blocks: [{ type: "tip", text: "When Alto Rich enables 2FA, we will announce it through official channels. Enable it promptly when available." }]
      }
    ]
  }),
  article({
    slug: "report-suspicious",
    title: "Reporting Suspicious Activity",
    description: "How to report fraud, phishing, or unauthorised account access.",
    category: "Security Academy",
    categorySlug: "security",
    keywords: ["report", "fraud", "suspicious", "support"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["phishing-awareness", "support-guide"],
    sections: [
      {
        heading: "When to report",
        paragraphs: [
          "Report immediately if you notice unauthorised login attempts, unexpected withdrawals, phishing messages claiming to be Alto Rich, or requests for your credentials."
        ]
      },
      {
        heading: "What to include",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Your registered email", description: "So support can locate your account." },
              { title: "Description of the incident", description: "What happened and when." },
              { title: "Screenshots if safe", description: "Of suspicious messages — redact personal data." }
            ]
          }
        ]
      }
    ]
  })
];
