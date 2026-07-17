import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getUserServices } from "@/lib/services";
import { buildPackagePlanCards } from "@/lib/packages/investment-catalog";
import { fetchInvestmentContext } from "@/lib/investment/mappers";
import { InvestmentPackageCard } from "@/components/investment/InvestmentPackageCard";
import { ActiveInvestmentsList } from "@/components/investment/ActiveInvestmentCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/domain";

export default async function InvestmentsPage() {
  const user = await getSessionUser();
  const services = await getUserServices();

  let plansError: string | null = null;
  let cards = buildPackagePlanCards([]);

  if (services) {
    try {
      const plans = await services.investments.listActivePlans();
      cards = buildPackagePlanCards(plans);
    } catch (error) {
      plansError = error instanceof Error ? error.message : "Unable to load investment packages.";
    }
  } else {
    plansError = "Investment services are temporarily unavailable. Please try again shortly.";
  }

  const preferredSlug =
    user && services
      ? (
          await services.supabase
            .from("profiles")
            .select("preferred_package_slug")
            .eq("id", user.id)
            .maybeSingle()
        ).data?.preferred_package_slug
      : null;

  let ctx = null;
  if (user && services) {
    try {
      ctx = await fetchInvestmentContext(services, user.id);
    } catch (error) {
      if (!plansError) {
        plansError = error instanceof Error ? error.message : "Unable to load your wallet and investments.";
      }
    }
  }

  const availableCards = cards.filter((c) => c.available && c.planId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Invest</p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">Select package</h1>
        <p className="max-w-xl text-sm text-[var(--text-muted)]">
          Fund your wallet, choose a package, and confirm in seconds. Earnings auto-reinvest weekly until you stop.
        </p>
      </header>

      {plansError ? (
        <Card variant="elevated" className="border-red-200/80 bg-red-50/90 dark:border-red-500/30 dark:bg-red-500/10">
          <p className="font-semibold text-red-800 dark:text-red-200">Could not load invest page</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{plansError}</p>
          <Link href="/dashboard" className="mt-4 inline-block">
            <Button size="sm" variant="outline">
              Return to dashboard
            </Button>
          </Link>
        </Card>
      ) : availableCards.length === 0 ? (
        <Card variant="elevated" className="py-12 text-center">
          <p className="text-lg font-semibold text-[var(--heading)]">No packages available right now</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Investment plans may be temporarily unavailable. Try again shortly or contact support.
          </p>
          <Link href="/dashboard" className="mt-6 inline-block">
            <Button variant="outline" size="sm">
              Back to dashboard
            </Button>
          </Link>
        </Card>
      ) : (
        <section>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <InvestmentPackageCard
                key={card.slug}
                card={card}
                walletBalance={ctx?.balance ?? 0}
                featured={card.slug === preferredSlug}
              />
            ))}
          </div>
        </section>
      )}

      {ctx && ctx.rows.some((r) => r.status === "active") ? (
        <ActiveInvestmentsList investments={ctx.rows} />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] px-5 py-4">
        <p className="text-sm text-[var(--text-muted)]">
          Wallet balance:{" "}
          <span className="currency-ngn font-semibold text-[var(--heading)]">
            {ctx ? formatNaira(ctx.balance) : "—"}
          </span>
        </p>
        <Link href="/deposits">
          <Button size="sm" variant="outline">
            Fund wallet
          </Button>
        </Link>
      </div>
    </div>
  );
}
