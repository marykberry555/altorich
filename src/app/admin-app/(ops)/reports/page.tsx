import { COMPANY } from "@/lib/company";
import { SettlementReportPanel } from "@/components/admin-app/SettlementReportPanel";
import { BankReconciliationPanel } from "@/components/admin-app/BankReconciliationPanel";

export default function AdminAppReportsPage() {
  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--admin-emerald-text)" }}>
          Monitoring
        </p>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--admin-heading)" }}>
          Reports & reconciliation
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--admin-muted)" }}>
          Settlement summaries, bank matching, and CSV exports for {COMPANY.brand} ops.
        </p>
      </header>

      <SettlementReportPanel />

      <div className="border-t" style={{ borderColor: "var(--admin-border)" }} />

      <BankReconciliationPanel />

      <div className="border-t" style={{ borderColor: "var(--admin-border)" }} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--admin-heading)" }}>
          Bulk CSV exports
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a href="/api/admin/export?type=members" className="button">
            Export members CSV
          </a>
          <a href="/api/admin/export?type=deposits" className="button">
            Export deposits CSV
          </a>
          <a href="/api/admin/export?type=withdrawals" className="button">
            Export withdrawals CSV
          </a>
        </div>
      </section>
    </div>
  );
}
