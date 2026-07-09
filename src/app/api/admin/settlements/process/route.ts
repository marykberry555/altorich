import { redirect } from "next/navigation";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";

export async function POST() {
  try {
    const reviewer = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const results = await services.settlements.processDueSettlements();
    await services.settlements.matureInvestments();

    await services.audit.log({
      actorId: reviewer.id,
      action: "settlement.triggered",
      entityType: "settlement_batch",
      metadata: { processed: results.length }
    });

    redirect("/admin");
  } catch (error) {
    return apiErrorResponse(error);
  }
}
