import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { getPublicServices, getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";

export async function GET() {
  try {
    const services = await getPublicServices();
    if (!services) throw Errors.notConfigured();

    const bank = await services.settings.getBankSwitchboard();
    const announcement = await services.settings.getAnnouncement();
    const withdrawalWindows = await services.settings.getWithdrawalWindows();

    return NextResponse.json({
      activeBankName: bank.active_bank_name,
      activeAccountName: bank.active_account_name,
      activeAccountNumber: bank.active_account_number,
      paymentInstruction: bank.payment_instruction,
      transferNarration: bank.transfer_narration,
      globalAnnouncement: announcement,
      contributionsEnabled: bank.contributions_enabled,
      withdrawalWindows
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const reviewer = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const formData = await request.formData();
    await services.settings.updateBankSwitchboard(
      {
        active_bank_name: String(formData.get("activeBankName") ?? ""),
        active_account_name: String(formData.get("activeAccountName") ?? ""),
        active_account_number: String(formData.get("activeAccountNumber") ?? ""),
        payment_instruction: String(formData.get("paymentInstruction") ?? ""),
        transfer_narration: String(formData.get("transferNarration") ?? ""),
        contributions_enabled: true
      },
      reviewer.id
    );

    const announcement = String(formData.get("globalAnnouncement") ?? "");
    if (announcement) {
      await services.settings.updateAnnouncement(announcement, reviewer.id);
    }

    await services.audit.log({
      actorId: reviewer.id,
      action: "settings.updated",
      entityType: "settings",
      metadata: { keys: ["bank_switchboard", "announcements"] }
    });

    redirect("/admin");
  } catch (error) {
    return apiErrorResponse(error);
  }
}
