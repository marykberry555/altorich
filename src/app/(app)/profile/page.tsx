import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { KycSection } from "@/components/profile/KycSection";
import { StatusBadge } from "@/components/design-system";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { formatNaira } from "@/lib/domain";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";

export default async function ProfilePage() {
  const user = await getSessionUser();
  const services = await getUserServices();

  let profile = null;
  let balance = 0;
  let kycStatus: "pending" | "approved" | "rejected" | "requires_update" = "pending";
  let kycRejectionReason: string | null = null;

  if (user && services) {
    const { data } = await services.supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
    kycStatus = (data?.kyc_status as typeof kycStatus) ?? "pending";
    kycRejectionReason = data?.kyc_rejection_reason ?? null;
    const wallet = await services.wallet.getWalletByUserId(user.id).catch(() => null);
    if (wallet) balance = await services.wallet.getBalance(wallet.id);
  }

  const links = [
    { href: "/wallet", label: "Wallet" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/deposits", label: "Deposit history" },
    { href: "/withdrawals", label: "Withdrawals" },
    { href: "/settings", label: "Settings" },
    { href: "/about", label: "About AltoRich" }
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHero eyebrow="Profile" title="Member account" description="Manage your identity, balances, and account shortcuts." />

      <Card variant="elevated" className="mt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <AvatarUpload
              fullName={profile?.full_name || user?.email || "Member"}
              avatarUrl={profile?.avatar_url}
              size="lg"
            />
            <div>
              <p className="text-sm text-[var(--text-subtle)]">Signed in as</p>
              <h2 className="text-xl font-bold text-[var(--heading)]">{profile?.full_name || user?.email || "Member"}</h2>
              <p className="text-sm text-[var(--text-muted)]">{profile?.phone || user?.email || "Add phone in settings"}</p>
              <div className="mt-2">
                <StatusBadge status={kycStatus} />
              </div>
            </div>
          </div>
          <Badge variant="gold">VIP {profile?.vip_level ?? 0}</Badge>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-6">
          <div>
            <p className="text-xs uppercase text-[var(--text-subtle)]">Balance</p>
            <p className="text-2xl font-bold tabular-nums">{formatNaira(balance)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-[var(--text-subtle)]">Invite code</p>
            <p className="text-lg font-bold tracking-widest">{profile?.invite_code ?? "—"}</p>
          </div>
        </div>
      </Card>

      <KycSection status={kycStatus} rejectionReason={kycRejectionReason} />

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {links.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card variant="outline" className="transition hover:border-[var(--emerald)] hover:shadow-[var(--shadow-sm)]">
              <span className="text-sm font-semibold">{item.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <Link href="/team" className="mt-6 block">
        <Button className="w-full">Open team & referrals</Button>
      </Link>
    </div>
  );
}
