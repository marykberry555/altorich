/**
 * Canonical user-facing portfolio terminology.
 * Prefer these labels in UI, emails, and notifications — avoid "package", "sector", "plan" in member copy.
 */
export const PORTFOLIO_TERMS = {
  investmentPortfolio: "Investment Portfolio",
  investmentPortfolios: "Investment Portfolios",
  portfolio: "Portfolio",
  portfolios: "Portfolios",
  strategy: "Strategy",
  primaryStrategy: "Primary Strategy",
  investmentRange: "Investment Range",
  minimum: "Minimum",
  maximum: "Maximum",
  dailyReturn: "Daily Return",
  dailyEarnings: "Daily Earnings",
  weeklyProjection: "Weekly Projection",
  monthlyProjection: "Monthly Projection",
  threeMonthProjection: "3 months",
  sixMonthProjection: "6 months",
  annualProjection: "Annual Projection",
  selectedPortfolio: "Selected Portfolio",
  investmentAmount: "Investment Amount",
  explorePortfolios: "Explore Investment Portfolios",
  startInvesting: "Start Investing",
  allocateToPortfolio: "Allocate to portfolio",
  preferredPortfolio: "Preferred Portfolio",
  portfolioCatalog: "Portfolio catalogue",
  browsePortfolios: "Browse portfolios",
  noPortfoliosAvailable: "No portfolios available right now",
  illustrativeOnly: "Illustrative only — not a guarantee of future results."
} as const;

/** Legacy terms that should not appear in member-facing UI. */
export const AVOID_IN_MEMBER_UI = [
  "package",
  "packages",
  "investment sector",
  "investment plan",
  "product",
  "guaranteed",
  "guarantee"
] as const;

export function formatInvestmentRange(minNgn: number, maxNgn: number, format: (n: number) => string) {
  return `${format(minNgn)} to ${format(maxNgn)}`;
}

/** Canonical order: Strategy → Portfolio name → Daily return + investment range. */
export function formatDailyReturnLabel(dailyReturnPercent: number) {
  return `${dailyReturnPercent}% daily return`;
}

export function formatPortfolioOfferLine(input: {
  dailyReturnPercent: number;
  minNgn: number;
  maxNgn: number;
  format: (n: number) => string;
}) {
  return `${formatDailyReturnLabel(input.dailyReturnPercent)} · ${formatInvestmentRange(input.minNgn, input.maxNgn, input.format)}`;
}
