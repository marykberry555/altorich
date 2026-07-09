import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatCard } from "@/components/ui/StatCard";
import { formatNaira } from "@/lib/domain";
import { getServices } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import { COMPANY } from "@/lib/company";

export default async function TeamPage() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const services = await getServices();

  let inviteCode = "—";
  let vipLevel = 0;
  let minMembers = 3;

  if (user && services) {
    const { data: profile } = await services.supabase.from("profiles").select("invite_code, vip_level").eq("id", user.id).single();
    inviteCode = profile?.invite_code ?? "—";
    vipLevel = profile?.vip_level ?? 0;
    const { data: nextVip } = await services.supabase.from("vip_levels").select("min_members").eq("level", vipLevel + 1).single();
    minMembers = Number((nextVip as { min_members?: number } | null)?.min_members ?? 3);
  }

  const inviteLink = `https://${COMPANY.domain}/auth/register?ref=${inviteCode}`;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHero eyebrow="Team" title="Grow your network" description="Invite verified members and unlock VIP cooperative dividends." />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's commission" value={formatNaira(0)} />
        <StatCard label="Total commission" value={formatNaira(0)} />
        <StatCard label="Team members" value={0} />
        <StatCard label="Valid invites" value={0} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card variant="elevated">
          <h2 className="font-semibold text-[var(--heading)]">Invite tools</h2>
          <div className="mt-4 grid gap-3">
            <Input label="Invite code" readOnly value={inviteCode} />
            <Input label="Invite link" readOnly value={inviteLink} />
          </div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Share after your invitee completes their first verified deposit. Commissions post when admin confirms qualifying activity.
          </p>
        </Card>
        <Card variant="elevated">
          <h2 className="font-semibold text-[var(--heading)]">VIP progress</h2>
          <p className="mt-2 text-3xl font-bold text-[var(--emerald)]">VIP {vipLevel}</p>
          <p className="text-sm text-[var(--text-muted)]">0 / {minMembers} members for next tier</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--gray-100)]">
            <div className="h-full w-0 rounded-full bg-[var(--emerald)]" />
          </div>
        </Card>
      </div>
    </div>
  );
}
