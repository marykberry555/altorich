import { Download, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { StatementOption } from "@/lib/financial-events/types";

type Props = {
  statements: StatementOption[];
  title?: string;
};

export function StatementDownloadsPanel({ statements, title = "Statements & reports" }: Props) {
  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-[var(--emerald)]" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Download official records of your account activity. PDF generation can be connected when enabled.
      </p>

      <ul className="mt-4 space-y-3">
        {statements.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-4 py-3"
          >
            <div>
              <p className="font-semibold text-[var(--heading)]">{item.title}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{item.description}</p>
            </div>
            {item.available && item.href ? (
              <a href={item.href} download>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Download size={14} aria-hidden />
                  Download
                </Button>
              </a>
            ) : (
              <Button size="sm" variant="outline" disabled className="gap-1.5">
                <Download size={14} aria-hidden />
                Not available
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function defaultStatementOptions(hasActivity: boolean): StatementOption[] {
  return [
    {
      id: "monthly",
      title: "Monthly Statement",
      description: "Summary of balances and activity for the current month.",
      available: false,
      href: null
    },
    {
      id: "transactions",
      title: "Transaction Statement",
      description: "Detailed ledger of wallet credits and debits.",
      available: hasActivity,
      href: hasActivity ? "/api/member/statements/transactions" : null
    },
    {
      id: "investment",
      title: "Investment Summary",
      description: "Active positions, earnings, and settlement history.",
      available: false,
      href: null
    },
    {
      id: "bonus",
      title: "Bonus Statement",
      description: "Welcome bonus allocation, qualification, and unlock timeline.",
      available: false,
      href: null
    },
    {
      id: "referral",
      title: "Referral Statement",
      description: "Referral commissions and payout history.",
      available: false,
      href: null
    }
  ];
}
