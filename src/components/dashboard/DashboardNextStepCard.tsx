import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NextAction } from "@/lib/dashboard/conversion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Props = {
  action: NextAction;
  className?: string;
};

const toneStyles = {
  emerald: "from-[var(--emerald)]/10 to-[var(--emerald-soft)] border-[var(--emerald)]/20",
  gold: "from-[var(--gold-soft)] to-amber-50/80 border-[var(--gold)]/25",
  navy: "from-[var(--navy-soft)] to-[var(--gray-50)] border-[var(--navy)]/15"
};

export function DashboardNextStepCard({ action, className }: Props) {
  const eyebrow = action.eyebrow ?? "Your next step";

  return (
    <Card
      variant="elevated"
      padding="md"
      className={cn("relative overflow-hidden border bg-gradient-to-br", toneStyles[action.tone], className)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-bold text-[var(--heading)]">{action.title}</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">{action.description}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link href={action.href}>
            <Button
              variant={action.tone === "gold" ? "gold" : "primary"}
              size="md"
              className="w-full gap-2 whitespace-nowrap sm:w-auto"
            >
              {action.cta}
              <ArrowRight size={16} aria-hidden />
            </Button>
          </Link>
          {action.secondaryCta ? (
            <Link href={action.secondaryCta.href}>
              <Button variant="outline" size="md" className="w-full whitespace-nowrap sm:w-auto">
                {action.secondaryCta.label}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
