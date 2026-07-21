import type { InvestmentPlan } from "@/types/database";
import { AppError } from "@/lib/errors";

/**
 * Public/admin API shape for investment plans.
 * Omits max_investment from client-facing payloads — ceilings are owned by portfolio config.
 */
export type PublicInvestmentPlan = Omit<InvestmentPlan, "max_investment">;

export function toPublicInvestmentPlan(plan: InvestmentPlan): PublicInvestmentPlan {
  const { max_investment: _ignored, ...rest } = plan;
  return rest;
}

export function toPublicInvestmentPlans(plans: InvestmentPlan[]): PublicInvestmentPlan[] {
  return plans.map(toPublicInvestmentPlan);
}

/** Reject admin payloads that attempt to set a principal ceiling directly. */
export function assertNoMaxInvestmentInBody(body: unknown) {
  if (!body || typeof body !== "object") return;
  if ("max_investment" in body || "maxInvestment" in body || "max_ngn" in body) {
    throw new AppError(
      "Maximum investment is managed by portfolio configuration. Update the portfolio config instead.",
      400,
      "MAX_INVESTMENT_CONFIG_OWNED"
    );
  }
}
