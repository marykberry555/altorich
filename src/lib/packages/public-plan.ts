import type { InvestmentPlan } from "@/types/database";
import { AppError } from "@/lib/errors";

/**
 * Public/admin API shape for investment sectors.
 * Intentionally omits max_investment so caps cannot be reintroduced via clients.
 */
export type PublicInvestmentPlan = Omit<InvestmentPlan, "max_investment">;

export function toPublicInvestmentPlan(plan: InvestmentPlan): PublicInvestmentPlan {
  const { max_investment: _ignored, ...rest } = plan;
  return rest;
}

export function toPublicInvestmentPlans(plans: InvestmentPlan[]): PublicInvestmentPlan[] {
  return plans.map(toPublicInvestmentPlan);
}

/** Reject admin payloads that attempt to set a principal ceiling. */
export function assertNoMaxInvestmentInBody(body: unknown) {
  if (!body || typeof body !== "object") return;
  if ("max_investment" in body || "maxInvestment" in body || "max_ngn" in body) {
    throw new AppError(
      "Investment sectors no longer support a maximum. Only minimum entry can be set.",
      400,
      "MAX_INVESTMENT_REMOVED"
    );
  }
}
