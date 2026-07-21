import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { cryptoAssetSchema, cryptoNetworkSchema } from "@/lib/payments/payment-rails";
import { readPayoutPreferences, type MemberCryptoWallet } from "@/lib/payments/member-destinations";
import type { Json } from "@/types/database";

export const dynamic = "force-dynamic";

const walletSchema = z.object({
  id: z.string().min(1),
  asset: cryptoAssetSchema.or(z.string().min(2).max(12)),
  network: cryptoNetworkSchema.or(z.string().min(2).max(20)),
  address: z.string().min(8).max(200),
  label: z.string().max(80).optional(),
  isDefault: z.boolean().optional()
});

const putSchema = z.object({
  wallets: z.array(walletSchema).max(20),
  preferredMethod: z.enum(["bank", "crypto"]).optional(),
  preferredAsset: z.string().optional(),
  preferredNetwork: z.string().optional()
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();
    const profile = await services.profile.getProfile(user.id);
    const payout = readPayoutPreferences(profile.notification_preferences);
    return NextResponse.json({
      wallets: payout.cryptoWallets ?? [],
      preferredMethod: payout.preferredMethod ?? null,
      preferredAsset: payout.preferredAsset ?? null,
      preferredNetwork: payout.preferredNetwork ?? null
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid crypto wallet payload.");

    const rails = await services.paymentRails.getResolved();
    if (!rails.cryptoWithdrawalOpen && !rails.cryptoDepositOpen) {
      throw Errors.business("Crypto rails are currently disabled.");
    }

    const profile = await services.profile.getProfile(user.id);
    const currentPrefs =
      profile.notification_preferences && typeof profile.notification_preferences === "object"
        ? (profile.notification_preferences as Record<string, unknown>)
        : {};
    const currentPayout = readPayoutPreferences(currentPrefs);

    const wallets = parsed.data.wallets as MemberCryptoWallet[];
    const nextPrefs = {
      ...currentPrefs,
      payout: {
        ...currentPayout,
        preferredMethod: parsed.data.preferredMethod ?? currentPayout.preferredMethod,
        preferredAsset: parsed.data.preferredAsset ?? currentPayout.preferredAsset,
        preferredNetwork: parsed.data.preferredNetwork ?? currentPayout.preferredNetwork,
        cryptoWallets: wallets
      }
    };

    const { error } = await services.supabase
      .from("profiles")
      .update({ notification_preferences: nextPrefs as Json })
      .eq("id", user.id);
    if (error) throw error;

    return NextResponse.json({ ok: true, wallets });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
