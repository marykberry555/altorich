import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { AdminNotesService } from "@/services/admin/admin-notes.service";
import { logAdminAction } from "@/lib/auth/admin-audit";

const createSchema = z.object({
  body: z.string().min(1).max(5000)
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await params;
    const notes = new AdminNotesService(services.supabase);
    const items = await notes.listForMember(id);

    return NextResponse.json({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await params;
    const body = createSchema.parse(await request.json());
    const notes = new AdminNotesService(services.supabase);
    const note = await notes.create({ memberId: id, authorId: admin.id, body: body.body });

    await logAdminAction(services.audit, request, {
      actorId: admin.id,
      action: "member.note_created",
      entityType: "profile",
      entityId: id,
      after: { noteId: note.id }
    });

    return NextResponse.json({ note });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
