import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const activities = [
  { title: "Fixed-term welfare", description: "Cooperative welfare pools with matured withdrawal schedules.", href: "/packages/starter", cta: "View Starter" },
  { title: "Referrals & VIP", description: "Grow your network and unlock referral rewards.", href: "/team", cta: "Referral dashboard" },
  { title: "Daily check-in", description: "Build your streak for cooperative rewards.", href: "/profile", cta: "Check in" },
  { title: "Learning centre", description: "Guides on investing responsibly with clear risk language.", href: "/learn", cta: "Start learning" }
];

export default function ActivitiesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHero
        eyebrow="Activities"
        title="Programmes & rewards"
        description="Optional cooperative programmes that support long-term discipline."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {activities.map((a) => (
          <Card key={a.title} variant="elevated">
            <h3 className="font-semibold text-[var(--heading)]">{a.title}</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{a.description}</p>
            <Link href={a.href} className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                {a.cta}
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
