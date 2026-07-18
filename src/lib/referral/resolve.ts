import { createServiceClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import { getServiceRoleServices } from "@/lib/services";
import {
  REFERRAL_INVALID_MESSAGE,
  normalizeReferralCode
} from "@/lib/referral/attribution";

export type ResolvedReferral = {
  code: string;
  referrerId: string;
  referrerName: string;
};

export async function resolveReferralCode(raw: string | null | undefined): Promise<ResolvedReferral> {
  const code = normalizeReferralCode(raw);
  if (!code) {
    throw new AppError(REFERRAL_INVALID_MESSAGE, 400, "REFERRAL_INVALID");
  }

  const services = await getServiceRoleServices();
  const supabase = services?.supabase ?? (await createServiceClient());
  if (!supabase) {
    throw new AppError("Registration is temporarily unavailable.", 503, "NOT_CONFIGURED");
  }

  if (services) {
    const config = await services.referrals.getProgramConfig();
    if (!config.enabled) {
      throw new AppError(REFERRAL_INVALID_MESSAGE, 400, "REFERRAL_EXPIRED");
    }
  }

  const { data: referrer, error } = await supabase
    .from("profiles")
    .select("id, full_name, invite_code, account_status")
    .eq("invite_code", code)
    .maybeSingle();

  if (error) throw error;
  if (!referrer?.id) {
    throw new AppError(REFERRAL_INVALID_MESSAGE, 400, "REFERRAL_INVALID");
  }

  if (referrer.account_status === "disabled" || referrer.account_status === "deactivated") {
    throw new AppError(REFERRAL_INVALID_MESSAGE, 400, "REFERRAL_INVALID");
  }

  return {
    code: referrer.invite_code,
    referrerId: referrer.id,
    referrerName: referrer.full_name?.trim() || "Alto Rich member"
  };
}
