import { COMPANY } from "@/lib/company";
import type { FaqCategorySlug, KnowledgeFaqItem } from "./types";

export const FAQ_CATEGORY_LABELS: Record<FaqCategorySlug, string> = {
  account: "Account",
  deposits: "Deposits",
  withdrawals: "Withdrawals",
  investments: "Investments",
  "welcome-bonus": "Welcome Bonus",
  referrals: "Referrals",
  security: "Security",
  technical: "Technical Support"
};

export const KNOWLEDGE_FAQ: KnowledgeFaqItem[] = [
  {
    id: "account-register",
    category: "account",
    question: "How do I create an Alto Rich account?",
    answer:
      "Visit the registration page, provide your details, and verify your email address. Complete your profile and add a verified Nigerian bank account before requesting withdrawals.",
    keywords: ["register", "signup", "create account"]
  },
  {
    id: "account-verify-email",
    category: "account",
    question: "Why must I verify my email?",
    answer:
      "Email verification confirms you control the address used for security alerts, password resets, and important account notifications. Some programmes — including the Welcome Bonus — require verified email.",
    keywords: ["email", "verification"]
  },
  {
    id: "account-kyc",
    category: "account",
    question: "What is KYC and when is it required?",
    answer:
      "Know Your Customer (KYC) verification helps us comply with anti-money-laundering regulations. Requirements may apply before certain transactions or higher limits. Upload clear documents when prompted in your dashboard.",
    keywords: ["kyc", "identity", "documents"]
  },
  {
    id: "deposits-how",
    category: "deposits",
    question: "How do I fund my wallet?",
    answer:
      "Transfer naira to the active receiving account shown in your dashboard, then submit your transfer amount and proof of payment. An administrator verifies the bank credit before your wallet balance updates.",
    keywords: ["fund", "deposit", "transfer", "wallet"]
  },
  {
    id: "deposits-pending",
    category: "deposits",
    question: "Why is my deposit still pending?",
    answer:
      "Deposits remain pending until your transfer is matched against our receiving account records. This may take time during high volume. You can track progress in your deposit history and notifications.",
    keywords: ["pending", "review", "waiting"]
  },
  {
    id: "deposits-reference",
    category: "deposits",
    question: "What reference should I use when transferring?",
    answer:
      "Use the reference or note shown on the funding page. Accurate references help our team reconcile your transfer quickly. Always transfer the exact amount you declare in your submission.",
    keywords: ["reference", "receipt", "note"]
  },
  {
    id: "withdrawals-when",
    category: "withdrawals",
    question: "When can I withdraw earnings?",
    answer:
      "Withdrawal requests are accepted according to published settlement windows — typically Monday from 09:00 WAT for processed payouts. Check your withdrawal page for the current schedule and queue status.",
    keywords: ["withdraw", "payout", "monday", "settlement"]
  },
  {
    id: "withdrawals-queue",
    category: "withdrawals",
    question: "What does queue position mean?",
    answer:
      "During settlement processing, withdrawals may be queued in order received. Your withdrawal tracker shows queue position and estimated processing time when scheduling data is available.",
    keywords: ["queue", "processing", "settlement"]
  },
  {
    id: "withdrawals-bank",
    category: "withdrawals",
    question: "Can I withdraw to any bank account?",
    answer:
      "Withdrawals are sent to verified bank accounts registered in your name on Alto Rich. Keep your bank details current in Settings before requesting a payout.",
    keywords: ["bank", "account number"]
  },
  {
    id: "investments-start",
    category: "investments",
    question: "How do I start investing?",
    answer:
      "Fund your naira wallet, choose an investment portfolio that matches your goals and timeline, and activate your allocation. Your portfolio page shows active positions and settlement history.",
    keywords: ["invest", "portfolio", "package", "activate"]
  },
  {
    id: "investments-earnings",
    category: "investments",
    question: "How are earnings calculated and paid?",
    answer:
      "Earnings follow the terms of your active investment plan and the platform's published earning model. Settlements are recorded in your wallet transaction history — review plan terms for frequency and conditions.",
    keywords: ["earnings", "returns", "settlement", "roi"]
  },
  {
    id: "investments-risk",
    category: "investments",
    question: "Are returns guaranteed?",
    answer:
      "All investments carry risk. Alto Rich publishes plan terms and risk disclosures — read them carefully. Educational content on this site is informational and not personalised financial advice.",
    keywords: ["guarantee", "risk", "returns"]
  },
  {
    id: "bonus-eligibility",
    category: "welcome-bonus",
    question: "Who qualifies for the Welcome Bonus?",
    answer:
      "Eligibility depends on programme availability, registration timing, email verification, and published qualification rules. Check your wallet dashboard for your personal status and remaining qualification period.",
    keywords: ["welcome bonus", "qualify", "eligibility"]
  },
  {
    id: "bonus-unlock",
    category: "welcome-bonus",
    question: "When does the Welcome Bonus unlock?",
    answer:
      "Unlock timing follows the programme rules shown in your Welcome Bonus card — typically after qualification requirements are met and the published unlock window opens. Track progress in your wallet.",
    keywords: ["unlock", "withdraw bonus"]
  },
  {
    id: "referrals-how",
    category: "referrals",
    question: "How does the referral programme work?",
    answer:
      "Share your invite link. When referred members register, verify, and make qualifying investments, you may earn commissions according to published VIP tier rates. Track each referral's progress on your team dashboard.",
    keywords: ["referral", "invite", "commission"]
  },
  {
    id: "referrals-payout",
    category: "referrals",
    question: "When are referral rewards paid?",
    answer:
      "Referral rewards accumulate in your referral wallet. Payouts follow programme thresholds and settlement windows — see your referral dashboard for eligibility and next settlement date.",
    keywords: ["referral payout", "rewards"]
  },
  {
    id: "security-password",
    category: "security",
    question: "How do I keep my account secure?",
    answer:
      "Use a strong unique password, verify your email, review login activity in Settings, and never share your PIN or OTP. Alto Rich will never ask for your password by email or phone.",
    keywords: ["password", "secure", "login"]
  },
  {
    id: "security-phishing",
    category: "security",
    question: "How do I recognise phishing?",
    answer:
      "Phishing messages often create urgency, use unofficial links, or ask for credentials. Always sign in via altorich.com or the official app. Report suspicious messages to support.",
    keywords: ["phishing", "scam", "fraud"]
  },
  {
    id: "technical-app",
    category: "technical",
    question: "The app or website is not loading — what should I do?",
    answer:
      "Check your internet connection, try refreshing, or visit /status for platform status. If the issue persists, contact support with your device, browser, and a description of the problem.",
    keywords: ["app", "loading", "error", "status"]
  },
  {
    id: "technical-support",
    category: "technical",
    question: "How do I contact support?",
    answer: `Use the contact page or email ${COMPANY.supportEmail}. Include your registered email and a clear description. Never share your password or full bank PIN in support messages.`,
    keywords: ["support", "help", "contact"]
  }
];

export function searchFaq(query: string, category?: FaqCategorySlug | "all") {
  const q = query.trim().toLowerCase();
  return KNOWLEDGE_FAQ.filter((item) => {
    if (category && category !== "all" && item.category !== category) return false;
    if (!q) return true;
    return (
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.keywords?.some((k) => k.includes(q))
    );
  });
}
