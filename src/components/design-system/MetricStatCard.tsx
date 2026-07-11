import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { accentBar, accentStyles, type StatAccent } from "./accent";

type Props = {
  title: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  href?: string;
  actionLabel?: string;
  accent?: StatAccent;
  className?: string;
};

function Body({ title, value, description, icon, href, actionLabel = "View details", accent = "emerald", className }: Props) {
  const styles = accentStyles[accent];
  const clickable = Boolean(href);

  return (
    <Card
      variant="elevated"
      padding="none"
      className={cn(
        "relative h-full overflow-hidden transition-all duration-200",
        clickable && cn("hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]", styles.hover),
        className
      )}
    >
      <div className={cn("h-1 w-full bg-gradient-to-r", accentBar(accent))} aria-hidden />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="pr-2 text-sm font-medium leading-snug text-[var(--text-muted)]">{title}</p>
          {icon ? (
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 [&_svg]:h-4 [&_svg]:w-4", styles.icon)}>
              {icon}
            </div>
          ) : null}
        </div>
        <p className="currency-ngn mt-3 text-2xl font-semibold tabular-nums tracking-tight text-[var(--text)]">{value}</p>
        {description ? <p className="mt-1 text-xs leading-relaxed text-[var(--text-subtle)]">{description}</p> : null}
        {clickable ? (
          <p className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--emerald)] opacity-80 group-hover:opacity-100">
            {actionLabel}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </p>
        ) : null}
      </div>
    </Card>
  );
}

export function MetricStatCard(props: Props) {
  if (props.href) {
    return (
      <Link href={props.href} className="group block h-full rounded-[var(--radius)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald-mid)]">
        <Body {...props} />
      </Link>
    );
  }
  return <Body {...props} />;
}
