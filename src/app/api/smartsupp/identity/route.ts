import { NextResponse } from "next/server";
import { getSessionUser, hasAdminRole } from "@/lib/auth/session";
import { getUserServices } from "@/lib/services";
import { getPackageLabel } from "@/lib/packages/constants";
import { buildSmartsuppTags } from "@/lib/chat/smartsupp-tags";
import { VIP_PACKAGE_BY_LEVEL } from "@/lib/referral/vip-display";
import type { SmartsuppIdentity } from "@/lib/chat/smartsupp";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    const guest: SmartsuppIdentity = {
      authenticated: false,
      tags: buildSmartsuppTags({ role: "guest" }),
      role: "guest"
    };
    return NextResponse.json(guest);
  }

  const services = await getUserServices();
  const isAdmin = await hasAdminRole();

  let fullName = user.email?.split("@")[0] ?? "Member";
  let preferredPackage: string | null = null;
  let vipLevel = 0;
  let walletBalance: number | undefined;
  let hasActiveInvestment = false;

  if (services) {
    const [{ data: profile }, dashboard] = await Promise.all([
      services.supabase
        .from("profiles")
        .select("full_name, preferred_package_slug, vip_level")
        .eq("id", user.id)
        .maybeSingle(),
      services.dashboard.getMemberDashboard(user.id).catch(() => null)
    ]);

    if (profile?.full_name) fullName = profile.full_name;
    preferredPackage = profile?.preferred_package_slug ?? null;
    vipLevel = Number(profile?.vip_level ?? 0);
    walletBalance = dashboard?.balance;
    hasActiveInvestment = (dashboard?.activeInvestments ?? 0) > 0;
  }

  const vipSlug = VIP_PACKAGE_BY_LEVEL[vipLevel];
  const vipLabel = vipSlug ? getPackageLabel(vipSlug) : undefined;
  const role = isAdmin ? "admin" : hasActiveInvestment ? "investor" : "member";

  const identity: SmartsuppIdentity = {
    authenticated: true,
    name: fullName,
    email: user.email ?? undefined,
    userId: user.id,
    package: getPackageLabel(preferredPackage),
    vipLevel,
    vipLabel,
    walletBalance,
    role,
    tags: buildSmartsuppTags({
      role: isAdmin ? "admin" : hasActiveInvestment ? "investor" : "member",
      isAdmin,
      hasActiveInvestment,
      preferredPackageSlug: preferredPackage,
      vipLevel
    })
  };

  return NextResponse.json(identity);
}
