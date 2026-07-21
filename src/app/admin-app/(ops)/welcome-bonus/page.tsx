import { WelcomeBonusAdminPanel } from "@/components/admin/WelcomeBonusAdminPanel";

export const dynamic = "force-dynamic";

export default function AdminWelcomeBonusPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--admin-emerald-text)" }}>
          Programmes
        </p>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--admin-heading)" }}>
          Welcome Bonus
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--admin-muted)" }}>
          First 200 verified members · promotional WB wallet · Monday unlock after 35-day qualification.
        </p>
      </header>
      <WelcomeBonusAdminPanel />
    </div>
  );
}
