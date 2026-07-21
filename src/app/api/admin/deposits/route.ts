import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
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
        const priorDepositsPromise = deposit.user_id
          ? services.supabase
              .from("deposits")
              .select("id, amount, status, created_at")
              .eq("user_id", deposit.user_id)
              .neq("id", deposit.id)
              .order("created_at", { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [] as { id: string; amount: number; status: string; created_at: string }[] });

        const [proofHref, priorDeposits] = await Promise.all([
          resolveProofHref(services, deposit.proof_url),
          priorDepositsPromise
        ]);

        const duplicateRef = deposit.receipt_note?.trim()
          ? await services.supabase
              .from("deposits")
              .select("id")
              .eq("receipt_note", deposit.receipt_note.trim())
              .neq("id", deposit.id)
              .limit(1)
          : { data: [] };

        return {
          ...deposit,
          proofHref,
          priorDeposits: priorDeposits.data ?? [],
          duplicateReference: (duplicateRef.data ?? []).length > 0
        };
      })
    );

    const stats = await services.deposits.getAdminStats();

    return NextResponse.json({ deposits: enriched, stats });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
