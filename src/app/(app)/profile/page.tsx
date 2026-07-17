import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProfileIdentityCard } from "@/components/profile/ProfileIdentityCard";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";

export default async function ProfilePage() {
  const user = await getSessionUser();
  const services = await getUserServices();

  let profile = null;

  if (user && services) {
    const { data } = await services.supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    profile = data;
  }

  const fullName = profile?.full_name || user?.email || "Member";

  const links = [
    { href: "/wallet", label: "Wallet" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/deposits", label: "Fund wallet" },
    { href: "/investments", label: "Invest" },
    { href: "/withdrawals", label: "Payouts" },
    { href: "/settings", label: "Settings" }
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">Profile</h1>
      </header>

      <ProfileIdentityCard
        fullName={fullName}
        username={profile?.username ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        packageSlug={profile?.preferred_package_slug ?? null}
        memberSince={profile?.created_at ?? null}
        emailVerifiedAt={profile?.email_verified_at ?? null}
        kycStatus={profile?.kyc_status ?? null}
        inviteCode={profile?.invite_code ?? null}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card variant="outline" className="transition hover:border-[var(--emerald)] hover:shadow-[var(--shadow-sm)]">
              <span className="text-sm font-semibold">{item.label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <Link href="/team" className="block">
        <Button className="w-full">Referrals & VIP</Button>
      </Link>
    </div>
  );
}
