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

export const GETTING_STARTED_ARTICLES: KnowledgeArticle[] = [
  article({
    slug: "creating-account",
    title: "Creating Your Account",
    description: "Register, verify your identity basics, and set up your Alto Rich member profile.",
    category: "Getting Started",
    categorySlug: "getting-started",
    keywords: ["register", "signup", "account", "profile"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["email-verification", "profile-management", "funding-wallet"],
    sections: [
      {
        heading: "Before you begin",
        paragraphs: [
          "You must be at least 18 years old with a valid Nigerian bank account in your name. Have your email address and phone number ready — you will need access to your email during verification."
        ],
        blocks: [
          {
            type: "tip",
            title: "Tip",
            text: "Use an email you check regularly. Security alerts and withdrawal updates are sent there."
          }
        ]
      },
      {
        heading: "Registration steps",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Open registration", description: "Visit the sign-up page and enter your full name, email, and phone number." },
              { title: "Create credentials", description: "Choose a strong password and secure PIN. Do not reuse passwords from other sites." },
              { title: "Verify email", description: "Click the link in your verification email to activate your account." },
              { title: "Complete profile", description: "Add your preferred investment sector and location to personalise your dashboard." }
            ]
          }
        ]
      },
      {
        heading: "What happens next",
        paragraphs: [
          "After registration, fund your wallet to begin investing. Your dashboard guides you through the next steps based on your account status."
        ]
      }
    ]
  }),
  article({
    slug: "email-verification",
    title: "Email Verification",
    description: "Why verification matters and how to confirm your email address securely.",
    category: "Getting Started",
    categorySlug: "getting-started",
    keywords: ["email", "verify", "activation"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["creating-account", "protect-email", "welcome-bonus-guide"],
    sections: [
      {
        heading: "Why we verify email",
        paragraphs: [
          "Email verification confirms you control the address associated with your account. It enables password recovery, security notifications, and eligibility for certain programmes."
        ]
      },
      {
        heading: "How to verify",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Check your inbox", description: "Look for a message from Alto Rich after registration. Check spam if needed." },
              { title: "Click the secure link", description: "The link expires after a period for security. Request a new one from the login page if it expires." },
              { title: "Confirm status", description: "Your profile shows verification status once complete." }
            ]
          }
        ]
      },
      {
        heading: "Troubleshooting",
        paragraphs: ["If you did not receive the email, wait a few minutes and check spam. Contact support if the problem persists — never share your password in support requests."],
        blocks: [
          { type: "warning", title: "Security", text: "Alto Rich will never ask you to verify email by sending your password or PIN." }
        ]
      }
    ]
  }),
  article({
    slug: "funding-wallet",
    title: "Funding Your Wallet",
    description: "Transfer naira to Alto Rich, submit proof, and track your deposit through approval.",
    category: "Getting Started",
    categorySlug: "getting-started",
    keywords: ["deposit", "fund", "transfer", "wallet"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["how-deposits-work", "investment-activation", "creating-account"],
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "Deposits use verified bank transfer. Transfer to the receiving account shown in your dashboard, then submit your amount and payment proof for review."
        ],
        blocks: [
          {
            type: "flow",
            title: "Funding flow",
            steps: ["Choose receiving account", "Transfer exact amount", "Submit proof & reference", "Await verification", "Wallet credited"]
          }
        ]
      },
      {
        heading: "Best practices",
        blocks: [
          {
            type: "best-practice",
            text: "Transfer the exact amount you declare. Mismatched amounts delay reconciliation."
          },
          {
            type: "best-practice",
            text: "Keep your bank transfer receipt until the deposit shows as approved."
          }
        ]
      }
    ]
  }),
  article({
    slug: "investment-activation",
    title: "Activating Your Investment",
    description: "Choose a sector, allocate wallet funds, and understand what happens when your investment starts.",
    category: "Getting Started",
    categorySlug: "getting-started",
    keywords: ["invest", "activate", "package", "sector"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["funding-wallet", "understanding-earnings", "investment-basics"],
    sections: [
      {
        heading: "Choosing a sector",
        paragraphs: [
          "Alto Rich offers investment sectors (Starter, Growth, Premium, Elite) as capital allocation categories. Review minimum amounts, duration, and settlement terms before committing."
        ]
      },
      {
        heading: "Activation steps",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Fund your wallet", description: "Ensure sufficient naira balance for your chosen allocation." },
              { title: "Browse packages", description: "Compare sectors on the investments page." },
              { title: "Confirm allocation", description: "Review terms and risk disclosure before confirming." },
              { title: "Track in portfolio", description: "Active investments appear in your portfolio with status and earnings history." }
            ]
          }
        ]
      }
    ]
  }),
  article({
    slug: "understanding-earnings",
    title: "Understanding Earnings",
    description: "How settlements work, where to find earnings in your wallet, and what affects your returns.",
    category: "Getting Started",
    categorySlug: "getting-started",
    keywords: ["earnings", "returns", "settlement", "roi"],
    difficulty: "intermediate",
    lastUpdated: UPDATED,
    relatedSlugs: ["monday-settlements", "how-settlements-work", "investment-basics"],
    sections: [
      {
        heading: "Earnings vs balance",
        paragraphs: [
          "Your wallet balance reflects verified credits and debits. Earnings from active investments are recorded as settlement transactions — check your wallet history and portfolio for details."
        ]
      },
      {
        heading: "Settlement schedule",
        paragraphs: [
          "Settlement frequency depends on your plan terms. Weekly settlements typically process on published windows. Your dashboard and notifications alert you when settlements complete."
        ],
        blocks: [
          { type: "tip", text: "Export or review wallet transactions periodically for your personal records." }
        ]
      }
    ]
  }),
  article({
    slug: "withdrawals-guide",
    title: "Requesting a Withdrawal",
    description: "Move earnings to your bank account — eligibility, bank details, and tracking your request.",
    category: "Getting Started",
    categorySlug: "getting-started",
    keywords: ["withdraw", "payout", "bank"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["monday-settlements", "how-withdrawals-work", "safe-banking"],
    sections: [
      {
        heading: "Before you withdraw",
        paragraphs: [
          "Ensure your bank account is registered and verified in Settings. Confirm you meet any minimum balance or active investment rules shown on the withdrawal page."
        ]
      },
      {
        heading: "Request process",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Open withdrawals", description: "Review available balance and settlement schedule." },
              { title: "Confirm bank account", description: "Select or add your Nigerian bank account." },
              { title: "Submit request", description: "Enter amount and confirm. You receive a reference for tracking." },
              { title: "Track progress", description: "Use the live withdrawal tracker for queue position and status updates." }
            ]
          }
        ]
      }
    ]
  }),
  article({
    slug: "monday-settlements",
    title: "Monday Settlements Explained",
    description: "How the weekly settlement window works and what to expect during processing.",
    category: "Getting Started",
    categorySlug: "getting-started",
    keywords: ["monday", "settlement", "wat", "queue"],
    difficulty: "intermediate",
    lastUpdated: UPDATED,
    relatedSlugs: ["how-settlements-work", "withdrawals-guide", "how-withdrawals-work"],
    sections: [
      {
        heading: "Settlement window",
        paragraphs: [
          "Withdrawal processing typically opens Monday at 09:00 local time. Requests submitted before the window may queue until processing begins."
        ],
        blocks: [
          {
            type: "flow",
            steps: ["Request submitted", "Queue assigned", "Processing", "Bank transfer", "Completed"]
          }
        ]
      },
      {
        heading: "What affects timing",
        paragraphs: [
          "Queue position, daily processing capacity, and verification steps all influence when your payout completes. When scheduling data is unavailable, your tracker shows that your request is waiting to be scheduled — never assume a time that is not shown in your account."
        ]
      }
    ]
  }),
  article({
    slug: "referral-programme",
    title: "The Referral Programme",
    description: "Share your invite link, track referred members, and understand commission eligibility.",
    category: "Getting Started",
    categorySlug: "getting-started",
    keywords: ["referral", "invite", "commission", "vip"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["referral-tracking", "creating-account"],
    sections: [
      {
        heading: "How referrals work",
        paragraphs: [
          "Each member receives an invite code and link. When someone registers through your link and completes qualifying steps, you may earn commissions based on your VIP tier."
        ]
      },
      {
        heading: "Tracking progress",
        paragraphs: [
          "Your team dashboard shows each referral's progress — registration, verification, and first deposit. Commissions appear in your referral wallet when programme rules are met."
        ]
      }
    ]
  }),
  article({
    slug: "welcome-bonus-guide",
    title: "Welcome Bonus Guide",
    description: "Understand allocation, qualification, unlock timing, and withdrawal of welcome bonus funds.",
    category: "Getting Started",
    categorySlug: "getting-started",
    keywords: ["welcome bonus", "qualification", "unlock"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["email-verification", "withdrawals-guide"],
    sections: [
      {
        heading: "Programme overview",
        paragraphs: [
          "The Welcome Bonus is a limited programme with defined slots and qualification rules. Availability is shown on your wallet page — programmes may close when slots are full."
        ]
      },
      {
        heading: "Your checklist",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Register during the programme", description: "Allocation is reserved for eligible new members while slots remain." },
              { title: "Verify email", description: "Required for qualification tracking." },
              { title: "Complete qualification period", description: "Meet activity requirements within the published window." },
              { title: "Unlock & withdraw", description: "Follow wallet instructions when bonus becomes available." }
            ]
          }
        ]
      }
    ]
  }),
  article({
    slug: "profile-management",
    title: "Managing Your Profile",
    description: "Update personal details, bank accounts, notification preferences, and security settings.",
    category: "Getting Started",
    categorySlug: "getting-started",
    keywords: ["profile", "settings", "bank", "preferences"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["creating-account", "account-security-overview"],
    sections: [
      {
        heading: "Profile settings",
        paragraphs: [
          "Update your name, phone, location, and preferred investment sector from Settings. Keep information accurate for support and compliance."
        ]
      },
      {
        heading: "Bank accounts",
        paragraphs: [
          "Add and verify Nigerian bank accounts for withdrawals. Changes to bank details may require additional verification for your protection."
        ],
        blocks: [
          { type: "warning", title: "Important", text: "Only add bank accounts in your own name. Third-party accounts are not permitted." }
        ]
      }
    ]
  })
];
