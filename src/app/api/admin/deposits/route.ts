import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { logger } from "@/lib/logger";
import { STORAGE_BUCKETS } from "@/services/storage/storage.service";

async function resolveProofHref(
  services: NonNullable<Awaited<ReturnType<typeof getServiceRoleServices>>>,
  proofUrl: string | null
) {
  if (!proofUrl) return null;
  if (/^https?:\/\//i.test(proofUrl)) return proofUrl;
  try {
    return await services.storage.getSignedUrl(STORAGE_BUCKETS.depositProofs, proofUrl, 3600);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const status = request.nextUrl.searchParams.get("status") ?? "pending";
    const deposits =
      status === "pending"
        ? await services.deposits.listPending()
        : await services.deposits.listRecent(100);

    const enriched = await Promise.all(
      deposits.map(async (deposit) => {
        try {
          const priorDepositsPromise = deposit.user_id
            ? services.supabase
                .from("deposits")
                .select("id, amount, status, created_at")
                .eq("user_id", deposit.user_id)
                .neq("id", deposit.id)
                .order("created_at", { ascending: false })
                .limit(5)
            : Promise.resolve({ data: [] as { id: string; amount: number; status: string; created_at: string }[], error: null });

          const [proofHref, priorDeposits] = await Promise.all([
            resolveProofHref(services, deposit.proof_url),
            priorDepositsPromise
          ]);

          if (priorDeposits.error) {
            logger.warn("Admin deposit enrich: prior deposits query failed", {
              depositId: deposit.id,
              message: priorDeposits.error.message
            });
          }

          let duplicateReference = false;
          if (deposit.receipt_note?.trim()) {
            const duplicateRef = await services.supabase
              .from("deposits")
              .select("id")
              .eq("receipt_note", deposit.receipt_note.trim())
              .neq("id", deposit.id)
              .limit(1);
            if (duplicateRef.error) {
              logger.warn("Admin deposit enrich: duplicate reference query failed", {
                depositId: deposit.id,
                message: duplicateRef.error.message
              });
            } else {
              duplicateReference = (duplicateRef.data ?? []).length > 0;
            }
          }

          return {
            ...deposit,
            proofHref,
            priorDeposits: priorDeposits.data ?? [],
            duplicateReference
          };
        } catch (error) {
          logger.warn("Admin deposit enrich: row skipped", {
            depositId: deposit.id,
            message: error instanceof Error ? error.message : String(error)
          });
          return {
            ...deposit,
            proofHref: null,
            priorDeposits: [],
            duplicateReference: false
          };
        }
      })
    );

    const stats = await services.deposits.getAdminStats();

    return NextResponse.json({ deposits: enriched, stats });
  } catch (error) {
    return apiErrorResponse(error, { route: "/api/admin/deposits", action: "list" });
  }
}
