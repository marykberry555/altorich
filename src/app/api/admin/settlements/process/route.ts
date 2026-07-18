import { redirect } from "next/navigation";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { HARD_OPS_HOME } from "@/lib/hard-ops";

export async function POST() {
  try {
    const reviewer = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const weeklyResults = await services.settlements.processWeeklyMondaySettlements();
    // Platform weekly engine is the sole settlement path for active book.
    // Do not also run legacy scheduled settlement rows (double-pay risk).
    await services.settlements.matureInvestments();

    await services.audit.log({
      actorId: reviewer.id,
      action: "settlement.triggered",
      entityType: "settlement_batch",
      metadata: { weekly: weeklyResults.length }
    });
  } catch (error) {
    return apiErrorResponse(error);
  }

  redirect(HARD_OPS_HOME);
}
