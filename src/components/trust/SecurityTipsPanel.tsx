import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { MEMBER_SECURITY_TIPS } from "@/lib/trust/security-tips";

export function SecurityTipsPanel() {
  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center gap-2">
        <Lightbulb size={16} className="text-[var(--emerald)]" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Security tips</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {MEMBER_SECURITY_TIPS.map((tip) => (
          <li key={tip.id} className="rounded-xl border border-[var(--border)] px-4 py-3">
            <p className="font-semibold text-[var(--heading)]">{tip.title}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{tip.body}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
