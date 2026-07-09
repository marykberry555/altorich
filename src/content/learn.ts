export type LearnArticle = {
  slug: string;
  path: string;
  title: string;
  description: string;
  category: string;
  readMinutes: number;
  sections: { heading: string; paragraphs: string[] }[];
};

export const LEARN_ARTICLES: LearnArticle[] = [
  {
    slug: "investment-basics",
    path: "/learn/investment-basics",
    title: "Investment Basics for Nigerians",
    description:
      "Understand how investments work, what returns really mean, and how to start building wealth with clarity — without hype or unrealistic promises.",
    category: "Foundations",
    readMinutes: 8,
    sections: [
      {
        heading: "What investing actually is",
        paragraphs: [
          "Investing means putting money into assets or programmes that can grow over time — often through interest, dividends, rental income, or business profits. It is not gambling, and it is not a shortcut to overnight wealth.",
          "For most Nigerians, investing starts with a clear goal: education fees, a home deposit, retirement, or business expansion. Your goal determines how much risk you can reasonably accept and how long you should stay invested."
        ]
      },
      {
        heading: "Risk and return go together",
        paragraphs: [
          "Higher potential returns usually come with higher uncertainty. A fixed-income plan may offer more predictable outcomes than an equity-linked product. Neither is inherently better — the right choice depends on your timeline and comfort with volatility.",
          "Always ask: what could go wrong? Liquidity (how quickly you can access funds), counterparty risk (who holds your money), and inflation (whether returns beat rising prices) matter as much as the advertised rate."
        ]
      },
      {
        heading: "Building a simple habit",
        paragraphs: [
          "Consistency beats timing. Regular contributions — even modest amounts — compound meaningfully over years. Pair investing with an emergency fund so you are not forced to sell at the wrong time.",
          "AltoRich is designed around transparent records, verified deposits, and structured plans. Before committing, read the plan terms, understand settlement schedules, and only invest what you can afford to lock away for the stated duration."
        ]
      }
    ]
  },
  {
    slug: "financial-literacy",
    path: "/learn/financial-literacy",
    title: "Financial Literacy Essentials",
    description: "Core money skills every Nigerian household should master — budgeting, debt, inflation, and making informed financial decisions.",
    category: "Foundations",
    readMinutes: 7,
    sections: [
      {
        heading: "Know your cash flow",
        paragraphs: [
          "Track income and expenses for at least one month. Many people discover that small recurring costs — data bundles, subscriptions, informal lending — consume more than expected.",
          "Separate needs, commitments, and wants. Commitments are non-negotiable for a period (rent, school fees, loan repayments). Wants are flexible. This distinction makes budgeting practical rather than restrictive."
        ]
      },
      {
        heading: "Debt: useful or dangerous",
        paragraphs: [
          "Not all debt is bad. A loan that funds productive business inventory can pay for itself. Consumer debt for depreciating items, especially at high interest, often erodes wealth.",
          "Before borrowing, calculate the total repayment cost, not just the monthly instalment. Compare alternatives: saving first, revenue-based financing, or cooperative structures."
        ]
      },
      {
        heading: "Inflation in Nigeria",
        paragraphs: [
          "If your savings earn 10% but inflation runs at 22%, your purchasing power still falls. Financial literacy means measuring real returns — what you gain after inflation — not just nominal figures on a statement.",
          "Diversification across cash, fixed income, and growth assets can help, but no single product eliminates inflation risk. Education and disciplined planning remain your best tools."
        ]
      }
    ]
  },
  {
    slug: "saving-strategies",
    path: "/learn/saving-strategies",
    title: "Saving Strategies That Work",
    description: "Practical saving approaches for Nigerian salaries, business income, and irregular earnings — including automation and goal-based accounts.",
    category: "Saving",
    readMinutes: 6,
    sections: [
      {
        heading: "Pay yourself first",
        paragraphs: [
          "Transfer a fixed percentage to savings immediately when income arrives — before discretionary spending. Even 5–10% builds momentum.",
          "For business owners, separate operating and personal accounts. Pay yourself a consistent 'salary' rather than drawing ad hoc from daily sales."
        ]
      },
      {
        heading: "Goal-based buckets",
        paragraphs: [
          "Label savings by purpose: emergency (3–6 months of essential expenses), short-term goals (1–2 years), and long-term wealth. Different timelines suit different products.",
          "AltoRich savings products are structured for defined horizons. Match the product duration to when you actually need the money."
        ]
      },
      {
        heading: "Automation and discipline",
        paragraphs: [
          "Standing orders, scheduled transfers, and locked savings reduce the temptation to skip a month. Treat savings like a bill — non-optional.",
          "Review quarterly. Increase contributions when income rises rather than expanding lifestyle at the same rate."
        ]
      }
    ]
  },
  {
    slug: "personal-finance",
    path: "/learn/personal-finance",
    title: "Personal Finance for Nigerian Professionals",
    description: "Manage salary, side income, pensions, and family obligations with a framework built for modern Nigerian life.",
    category: "Personal",
    readMinutes: 7,
    sections: [
      {
        heading: "The Nigerian financial picture",
        paragraphs: [
          "Many professionals support extended family, fund education, and navigate currency volatility simultaneously. A realistic plan acknowledges these obligations rather than ignoring them.",
          "Build buffers: emergency fund first, then insurance where appropriate (health, life), then investments. Skipping buffers often forces costly withdrawals later."
        ]
      },
      {
        heading: "Pension and retirement",
        paragraphs: [
          "PFA contributions are a foundation, not the full solution. Supplement with voluntary contributions and personal investments aligned to your retirement timeline.",
          "Start early. A 35-year horizon allows smaller monthly amounts to reach meaningful totals through compounding."
        ]
      },
      {
        heading: "Documentation matters",
        paragraphs: [
          "Keep records of bank transfers, investment confirmations, and tax-relevant documents. Digital platforms like AltoRich provide transaction history — export and archive periodically for your own files."
        ]
      }
    ]
  },
  {
    slug: "wealth-building",
    path: "/learn/wealth-building",
    title: "Long-Term Wealth Building",
    description: "A measured approach to building lasting wealth in Nigeria — diversification, patience, and avoiding common traps.",
    category: "Wealth",
    readMinutes: 8,
    sections: [
      {
        heading: "Wealth is a process",
        paragraphs: [
          "Sustainable wealth rarely comes from a single bet. It accumulates through earning capacity, saving discipline, prudent investing, and protecting what you build.",
          "Beware of schemes promising guaranteed high returns with no risk. If it sounds too good to be true, verify licensing, governance, and how returns are actually generated."
        ]
      },
      {
        heading: "Diversification",
        paragraphs: [
          "Spread exposure across asset types, sectors, and time horizons. Nigerian investors often overweight property and cash; consider balanced exposure to fixed income and cooperative investment plans.",
          "Rebalance periodically. What was 60% of your portfolio can become 80% after a rally — adjust back toward your target allocation."
        ]
      },
      {
        heading: "AltoRich philosophy",
        paragraphs: [
          "We focus on clarity: visible balances, auditable records, and plans with defined terms. Wealth building is a partnership between you and institutions you trust — choose partners who communicate openly, especially when markets are uncertain."
        ]
      }
    ]
  },
  {
    slug: "business-finance",
    path: "/learn/business-finance",
    title: "Business Finance Fundamentals",
    description: "Cash flow, working capital, and investment decisions for Nigerian SMEs and entrepreneurs.",
    category: "Business",
    readMinutes: 7,
    sections: [
      {
        heading: "Cash flow vs profit",
        paragraphs: [
          "A profitable business can still fail if cash timing is wrong. Track when money enters and leaves — payroll, inventory, rent, and tax deadlines.",
          "Maintain a cash runway: months of fixed costs covered by liquid reserves. This buffer absorbs slow seasons without emergency borrowing."
        ]
      },
      {
        heading: "Working capital",
        paragraphs: [
          "Inventory and receivables tie up cash. Negotiate supplier terms, invoice promptly, and follow up on overdue payments. Small improvements in collection cycles free significant capital.",
          "Match funding duration to asset life. Short-term facilities for inventory turns; longer structures for equipment or expansion."
        ]
      },
      {
        heading: "When to seek investment",
        paragraphs: [
          "External capital makes sense when you have a clear use of funds, measurable returns, and governance to deploy it responsibly. Document a simple business case before approaching investors or platforms."
        ]
      }
    ]
  },
  {
    slug: "sme-funding",
    path: "/learn/sme-funding",
    title: "SME Funding Options in Nigeria",
    description: "Compare loans, grants, cooperative capital, and investment platforms available to Nigerian small and medium enterprises.",
    category: "Business",
    readMinutes: 6,
    sections: [
      {
        heading: "Sources of capital",
        paragraphs: [
          "SMEs in Nigeria access funds through commercial banks, microfinance institutions, fintech lenders, angel investors, government schemes, and member-based cooperatives.",
          "Each source differs in cost, speed, collateral requirements, and reporting obligations. Shop comparatively — the cheapest headline rate may include hidden fees."
        ]
      },
      {
        heading: "Preparing your business",
        paragraphs: [
          "Lenders and investors expect basic records: registration documents, bank statements, sales history, and a credible plan for deployed capital. Even informal businesses benefit from simple bookkeeping.",
          "AltoRich SME programmes connect structured member capital to vetted opportunities. Understand eligibility, tenure, and how returns are distributed before participating."
        ]
      },
      {
        heading: "Responsible borrowing",
        paragraphs: [
          "Borrow only what cash flow can service. Stress-test repayments: if revenue drops 20%, can you still pay? If not, reduce the amount or extend the term."
        ]
      }
    ]
  },
  {
    slug: "retirement-planning",
    path: "/learn/retirement-planning",
    title: "Retirement Planning in Nigeria",
    description: "Build retirement security beyond your PFA — voluntary contributions, investments, and realistic lifestyle planning.",
    category: "Personal",
    readMinutes: 6,
    sections: [
      {
        heading: "Start with a target",
        paragraphs: [
          "Estimate annual expenses in retirement (housing, healthcare, family support). Multiply by expected years in retirement. That figure guides how aggressively you need to save today.",
          "Adjust for inflation. ₦100,000 monthly today will not buy the same basket of goods in twenty years."
        ]
      },
      {
        heading: "Layer your sources",
        paragraphs: [
          "Combine PFA balances, personal investments, rental income, and any employer benefits. No single pillar should carry the entire weight.",
          "Consider phased retirement — consulting or part-time work — to reduce the savings burden while staying engaged."
        ]
      },
      {
        heading: "Investment horizon",
        paragraphs: [
          "Younger savers can accept more volatility for growth. Near retirement, gradually shift toward capital preservation and predictable income streams."
        ]
      }
    ]
  },
  {
    slug: "investment-risk",
    path: "/learn/investment-risk",
    title: "Understanding Investment Risk",
    description: "Types of risk Nigerian investors face — market, credit, liquidity, currency — and how to manage them without fear or denial.",
    category: "Foundations",
    readMinutes: 7,
    sections: [
      {
        heading: "Categories of risk",
        paragraphs: [
          "Market risk: asset prices move up and down. Credit risk: a borrower or counterparty may default. Liquidity risk: you cannot exit when needed. Operational risk: systems, fraud, or process failure.",
          "Nigerian investors also face currency risk when holding foreign assets and policy risk when regulations change. Name the risks in any product before you invest."
        ]
      },
      {
        heading: "Risk tolerance",
        paragraphs: [
          "Tolerance is emotional and financial. If a 10% drop would force you to sell essentials, your allocation is too aggressive. Honest self-assessment prevents panic decisions.",
          "Risk capacity is different from tolerance — a young professional with stable income may have capacity for volatility even if they feel nervous. Education reduces anxiety."
        ]
      },
      {
        heading: "Mitigation",
        paragraphs: [
          "Diversify, use regulated platforms, read disclosures, and keep emergency liquidity separate from long-term investments. AltoRich publishes risk disclosures — review them alongside each plan."
        ]
      }
    ]
  },
  {
    slug: "glossary",
    path: "/learn/glossary",
    title: "Investment & Finance Glossary",
    description: "Plain-language definitions of common investment and personal finance terms used on AltoRich and across Nigerian financial services.",
    category: "Reference",
    readMinutes: 5,
    sections: [
      {
        heading: "Core terms",
        paragraphs: [
          "APR / APY — Annual rate of return; APY includes compounding effects.",
          "Liquidity — How quickly an asset can be converted to cash without significant loss.",
          "Principal — The original amount invested, excluding returns.",
          "Yield — Income generated by an investment, often expressed as a percentage of cost or value.",
          "Tenure — The agreed duration an investment remains locked or active.",
          "Settlement — Scheduled distribution of returns or principal according to plan terms.",
          "Wallet balance — Available funds in your AltoRich account before allocation to investments.",
          "KYC — Know Your Customer verification required to comply with anti-money-laundering rules."
        ]
      },
      {
        heading: "AltoRich-specific",
        paragraphs: [
          "Investment plan — A structured product with defined minimum, maximum, duration, and settlement schedule.",
          "Portfolio — Your combined active investments and their status on AltoRich.",
          "Member record — Verified account history including deposits, withdrawals, and investment activity."
        ]
      }
    ]
  }
];

export function getLearnArticle(slug: string) {
  return LEARN_ARTICLES.find((a) => a.slug === slug);
}
