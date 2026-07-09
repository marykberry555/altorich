import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/domain";
import { getServices } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";

export default async function VipPage() {
  const services = await getServices();
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  type VipRow = { level: number; label: string; min_members: number; weekly_dividend: number };
  const tiers = (services
    ? (await services.supabase.from("vip_levels").select("*").order("level", { ascending: true })).data
    : []) as VipRow[] | null;

  let currentLevel = 0;
  if (user && services) {
    const { data: profile } = await services.supabase.from("profiles").select("vip_level").eq("id", user.id).single();
    currentLevel = profile?.vip_level ?? 0;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHero eyebrow="VIP" title="Member tier programme" description="Cooperative dividends based on verified team growth — not pyramid marketing." />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(tiers ?? []).map((tier) => (
          <Card key={tier.level} variant={tier.level === currentLevel ? "elevated" : "outline"}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--heading)]">VIP {tier.level}</span>
              <Badge variant={tier.level === currentLevel ? "emerald" : "outline"}>{tier.label}</Badge>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums">{formatNaira(Number(tier.weekly_dividend))}</p>
            <p className="mt-1 text-xs text-[var(--text-subtle)]">Weekly · {tier.min_members} members required</p>
          </Card>
        ))}
      </div>

      <Link href="/team" className="mt-8 inline-block">
        <Button>Grow your team</Button>
      </Link>
    </div>
  );
}
