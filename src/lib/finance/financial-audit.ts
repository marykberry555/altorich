import type { AuditService } from "@/services/audit/audit.service";

/** Structured financial audit payload — required fields for every money movement. */
export type FinancialAuditState = {
  status?: string | null;
  amount?: number | null;
  reference?: string | null;
  wallet_transaction_id?: string | null;
  [key: string]: unknown;
};

export async function logFinancialAction(
  audit: AuditService,
  input: {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    reference?: string | null;
    previousState: FinancialAuditState;
    newState: FinancialAuditState;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }
) {
  await audit.log({
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    ipAddress: input.ipAddress,
    metadata: {
      timestamp: new Date().toISOString(),
      reference: input.reference ?? input.entityId,
      previous_state: input.previousState,
      new_state: input.newState,
      ...(input.metadata ?? {})
    }
  });
}
