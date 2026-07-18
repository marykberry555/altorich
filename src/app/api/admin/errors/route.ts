import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getServiceRoleServices } from "@/lib/services";
import { apiErrorResponse, Errors } from "@/lib/errors";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "ignored"])
});

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const q = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);

    let query = services.supabase
      .from("application_errors")
      .select(
        "id, reference_id, category, status, message, user_message, code, user_id, route, action, request_id, correlation_id, environment, browser, device, stack, metadata, resolved_at, resolved_by, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status as "open" | "investigating" | "resolved" | "ignored");
    }
    if (category && category !== "all") query = query.eq("category", category);
    if (q) {
      query = query.or(
        `reference_id.ilike.%${q}%,message.ilike.%${q}%,route.ilike.%${q}%,action.ilike.%${q}%,code.ilike.%${q}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const userIds = [...new Set((data ?? []).map((row) => row.user_id).filter(Boolean))] as string[];
    let names: Record<string, string> = {};
    if (userIds.length) {
      const { data: profiles } = await services.supabase
        .from("profiles")
        .select("id, full_name, username")
        .in("id", userIds);
      names = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, p.full_name || p.username || p.id.slice(0, 8)])
      );
    }

    const rows = (data ?? []).map((row) => ({
      ...row,
      user_label: row.user_id ? names[row.user_id] ?? row.user_id.slice(0, 8) : "Anonymous"
    }));

    return NextResponse.json({ rows });
  } catch (error) {
    return apiErrorResponse(error, { route: "/api/admin/errors", action: "list" });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : null;
    const parsed = patchSchema.safeParse(body);
    if (!id || !parsed.success) throw Errors.badRequest("Invalid error status update.");

    const resolved = parsed.data.status === "resolved" || parsed.data.status === "ignored";
    const { data, error } = await services.supabase
      .from("application_errors")
      .update({
        status: parsed.data.status,
        resolved_at: resolved ? new Date().toISOString() : null,
        resolved_by: resolved ? admin.id : null
      })
      .eq("id", id)
      .select("id, status, resolved_at")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return apiErrorResponse(error, { route: "/api/admin/errors", action: "update" });
  }
}
