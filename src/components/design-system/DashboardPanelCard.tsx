import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { accentBar, type StatAccent } from "./accent";

type Props = {
  title: string;
  href?: string;
  viewLabel?: string;
  accent?: StatAccent;
  children: React.ReactNode;
  className?: string;
};

export function DashboardPanelCard({
  title,
  href,
  viewLabel = "Open",
  accent = "emerald",
  children,
  className
}: Props) {
  const header = (
    <div className="flex items-center justify-between gap-3 px-6 pb-3 pt-5">
      <h2 className="text-base font-semibold text-[var(--heading)]">{title}</h2>
      {href ? <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--emerald)]" aria-hidden /> : null}
    </div>
  );

  return (
    <Card variant="elevated" padding="none" className={cn("group relative overflow-hidden", href && "hover:shadow-[var(--shadow-md)]", className)}>
      <div className={cn("h-1 w-full bg-gradient-to-r", accentBar(accent))} aria-hidden />
      {href ? (
        <Link href={href} className="block transition-colors hover:bg-[var(--gray-50)]/50">
          {header}
        </Link>
      ) : (
        header
      )}
      <div className="px-6 pb-5">{children}</div>
      {href ? (
        <Link
          href={href}
          className="block border-t border-[var(--border)] bg-[var(--gray-50)]/60 px-6 py-2.5 text-xs font-medium text-[var(--emerald)] transition hover:bg-[var(--gray-100)]/80"
        >
          {viewLabel} →
        </Link>
      ) : null}
    </Card>
  );
}
