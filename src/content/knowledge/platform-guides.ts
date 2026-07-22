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

export const PLATFORM_GUIDE_ARTICLES: KnowledgeArticle[] = [
  article({
    slug: "how-deposits-work",
    title: "How Deposits Work",
    description: "The member-facing deposit journey — from bank transfer to wallet credit and investment allocation.",
    category: "Platform Guides",
    categorySlug: "platform-guides",
    keywords: ["deposit", "transfer", "verification", "wallet"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["funding-wallet", "transaction-references", "how-settlements-work"],
    sections: [
      {
        heading: "The deposit journey",
        blocks: [
          {
            type: "flow",
            steps: ["Transfer submitted", "Receipt uploaded", "Awaiting review", "Verified", "Wallet credited", "Investment started"]
          }
        ]
      },
      {
        heading: "What you see in your account",
        paragraphs: [
          "Your deposit tracker shows each stage with timestamps. Pending deposits appear in your funding history until approved or rejected."
        ],
        blocks: [{ type: "tip", text: "Never send money without submitting proof in your dashboard — unreported transfers cannot be matched." }]
      }
    ]
  }),
  article({
    slug: "how-withdrawals-work",
    title: "How Withdrawals Work",
    description: "Requesting payouts, queue scheduling, bank transfer, and tracking completion.",
    category: "Platform Guides",
    categorySlug: "platform-guides",
    keywords: ["withdrawal", "payout", "bank", "queue"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["withdrawals-guide", "monday-settlements", "how-settlements-work"],
    sections: [
      {
        heading: "Withdrawal lifecycle",
        blocks: [
          {
            type: "flow",
            steps: ["Requested", "Queue assigned", "Processing", "Bank transfer", "Completed"]
          }
        ]
      },
      {
        heading: "Tracking your request",
        paragraphs: [
          "Each withdrawal has a reference number and live tracker. Queue position and estimated processing appear only when scheduling data is available — otherwise you will see that your request is waiting to be scheduled."
        ]
      }
    ]
  }),
  article({
    slug: "how-settlements-work",
    title: "How Settlements Work",
    description: "Weekly processing windows, investment earnings, and referral payout schedules.",
    category: "Platform Guides",
    categorySlug: "platform-guides",
    keywords: ["settlement", "monday", "earnings", "schedule"],
    difficulty: "intermediate",
    lastUpdated: UPDATED,
    relatedSlugs: ["monday-settlements", "understanding-earnings", "how-withdrawals-work"],
    sections: [
      {
        heading: "Settlement windows",
        paragraphs: [
          "Alto Rich processes certain payouts on published weekly windows — typically Monday from 9:00 AM. Investment earnings and withdrawal batches follow separate but related schedules documented in your dashboard."
        ]
      },
      {
        heading: "Member notifications",
        paragraphs: ["You receive in-app and email notifications when settlements complete. Check your wallet transaction history for credited amounts and references."]
      }
    ]
  }),
  article({
    slug: "transaction-references",
    title: "Understanding Transaction References",
    description: "How deposit, withdrawal, and wallet references help you trace every movement of funds.",
    category: "Platform Guides",
    categorySlug: "platform-guides",
    keywords: ["reference", "settlement", "tracking", "receipt"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["how-deposits-work", "how-withdrawals-work", "glossary"],
    sections: [
      {
        heading: "Why references matter",
        paragraphs: [
          "Every deposit, withdrawal, and wallet transaction carries a reference. These identifiers help you, support staff, and reconciliation teams match bank transfers to account records."
        ]
      },
      {
        heading: "Types of references",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Deposit reference", description: "The note or reference you provide when submitting a funding request." },
              { title: "Settlement reference", description: "Assigned to withdrawal requests during queue processing (e.g. ALT-YYYYMMDD-NNNNNN)." },
              { title: "Wallet transaction reference", description: "Appears in your ledger for every credit and debit." }
            ]
          }
        ]
      }
    ]
  }),
  article({
    slug: "notifications-guide",
    title: "How Notifications Work",
    description: "In-app alerts, email preferences, and staying informed about your account.",
    category: "Platform Guides",
    categorySlug: "platform-guides",
    keywords: ["notifications", "alerts", "email", "updates"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["dashboard-guide", "account-security-overview"],
    sections: [
      {
        heading: "Notification channels",
        paragraphs: [
          "Alto Rich sends in-app notifications for deposits, withdrawals, investments, referrals, and security events. Email notifications can be managed in Settings."
        ]
      },
      {
        heading: "Categories",
        paragraphs: [
          "Your notification centre groups updates by type — deposits, withdrawals, investment, bonus, referral, security, and announcements. Unread items are marked until you view them."
        ]
      }
    ]
  }),
  article({
    slug: "account-security-overview",
    title: "How Account Security Works",
    description: "Login activity, trusted devices, verification, and protecting your member account.",
    category: "Platform Guides",
    categorySlug: "platform-guides",
    keywords: ["security", "login", "devices", "verification"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["strong-passwords", "phishing-awareness", "profile-management"],
    sections: [
      {
        heading: "Security features",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Email verification", description: "Confirms account ownership." },
              { title: "Login activity", description: "Review recent sign-ins in Settings." },
              { title: "Trusted devices", description: "Manage browsers authorised for quick sign-in." },
              { title: "Bank verification", description: "Withdrawals only to verified accounts in your name." }
            ]
          }
        ]
      }
    ]
  }),
  article({
    slug: "support-guide",
    title: "How Support Works",
    description: "Getting help with your account, what information to provide, and response expectations.",
    category: "Platform Guides",
    categorySlug: "platform-guides",
    keywords: ["support", "help", "contact", "complaints"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["creating-account", "how-deposits-work"],
    sections: [
      {
        heading: "Before contacting support",
        paragraphs: [
          "Check the Knowledge Center and FAQ — many questions are answered here. For transaction issues, have your reference number, amount, and date ready."
        ],
        blocks: [{ type: "warning", text: "Never share your password, PIN, or full card details in support messages." }]
      },
      {
        heading: "Contact channels",
        paragraphs: ["Use the contact page or your dashboard help links. Official communications come from verified Alto Rich channels only."]
      }
    ]
  }),
  article({
    slug: "referral-tracking",
    title: "How Referral Tracking Works",
    description: "Follow each referred member from registration through first deposit and commission.",
    category: "Platform Guides",
    categorySlug: "platform-guides",
    keywords: ["referral", "tracking", "commission", "invite"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["referral-programme", "dashboard-guide"],
    sections: [
      {
        heading: "Referral progress",
        blocks: [
          {
            type: "flow",
            steps: ["Registered", "Email verified", "First deposit", "Commission earned"]
          }
        ]
      },
      {
        heading: "Your team dashboard",
        paragraphs: [
          "Each referral shows a step tracker and outcome status. Commissions credit to your referral wallet when programme rules are satisfied."
        ]
      }
    ]
  }),
  article({
    slug: "dashboard-guide",
    title: "Understanding Your Dashboard",
    description: "Navigate balances, activity, alerts, quick actions, and what each section tells you.",
    category: "Platform Guides",
    categorySlug: "platform-guides",
    keywords: ["dashboard", "overview", "balance", "activity"],
    difficulty: "beginner",
    lastUpdated: UPDATED,
    relatedSlugs: ["creating-account", "notifications-guide", "how-it-works"],
    sections: [
      {
        heading: "Dashboard sections",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Wealth summary", description: "Wallet balance, portfolio value, and primary next action." },
              { title: "Smart alerts", description: "Actionable items requiring your attention." },
              { title: "Activity timeline", description: "Recent deposits, investments, and settlements." },
              { title: "Quick actions", description: "Shortcuts to fund, invest, withdraw, and learn." }
            ]
          }
        ]
      }
    ]
  })
];
