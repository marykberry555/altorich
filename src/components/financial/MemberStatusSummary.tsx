import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { MemberStatusItem } from "@/lib/financial-events/types";

type Props = {
  items: MemberStatusItem[];
  title?: string;
};

const toneStyles = {
  emerald: "border-[var(--emerald)]/20 bg-[var(--emerald)]/5",
  gold: "border-amber-500/20 bg-amber-500/5",
  navy: "border-[var(--navy)]/15 bg-[var(--navy)]/5",
  slate: "border-[var(--border)] bg-[var(--gray-50)]/50"
} as const;

export function MemberStatusSummary({ items, title = "Member status" }: Props) {
  return (
    <Card variant="elevated" padding="md">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{title}</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const content = (
            <>
              <dt className="text-xs text-[var(--text-subtle)]">{item.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--heading)]">{item.value}</dd>
            </>
          );

          const className = cn(
            "rounded-xl border px-4 py-3 transition-shadow hover:shadow-[var(--shadow-sm)]",
            toneStyles[item.tone ?? "slate"]
          );

          return item.href ? (
            <Link key={item.id} href={item.href} className={className}>
              {content}
            </Link>
          ) : (
            <div key={item.id} className={className}>
              {content}
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
