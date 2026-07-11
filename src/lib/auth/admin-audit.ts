import type { AuditService } from "@/services/audit/audit.service";
import { clientIpFromHeaders } from "@/lib/auth/user-agent";

export async function logAdminAction(
  audit: AuditService,
  request: Request,
  input: {
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }
) {
  const metadata: Record<string, unknown> = { ...(input.metadata ?? {}) };
  if (input.before !== undefined) metadata.before = input.before;
  if (input.after !== undefined) metadata.after = input.after;

  await audit.log({
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    ipAddress: clientIpFromHeaders(request.headers),
    metadata
  });
}
