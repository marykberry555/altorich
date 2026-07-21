import type { KnowledgeBlock } from "@/content/knowledge/types";
import { StepNumber } from "@/components/ui/StepNumber";

export function KnowledgeBlockRenderer({ blocks }: { blocks: KnowledgeBlock[] }) {
  return (
    <div className="mt-4 space-y-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p key={i} className="text-[var(--text-muted)] leading-relaxed">
                {block.text}
              </p>
            );
          case "steps":
            return (
              <ol key={i} className="space-y-4">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-4">
                    <StepNumber value={String(j + 1)} size="md" />
                    <div>
                      <p className="font-semibold text-[var(--heading)]">{item.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            );
          case "flow":
            return (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/50 p-4 dark:bg-[var(--surface)]">
                {block.title ? <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">{block.title}</p> : null}
                <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {block.steps.map((step, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--emerald)]/10 text-xs font-bold text-[var(--emerald)]">
                        {j + 1}
                      </span>
                      <span className="font-medium text-[var(--heading)]">{step}</span>
                      {j < block.steps.length - 1 ? (
                        <span className="hidden text-[var(--text-subtle)] sm:inline" aria-hidden>
                          →
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            );
          case "tip":
            return (
              <div key={i} className="rounded-xl border border-[var(--emerald)]/30 bg-[var(--emerald)]/5 px-4 py-3">
                {block.title ? <p className="text-xs font-semibold uppercase text-[var(--emerald)]">{block.title}</p> : null}
                <p className="mt-1 text-sm text-[var(--text-muted)]">{block.text}</p>
              </div>
            );
          case "warning":
            return (
              <div key={i} className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                {block.title ? <p className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300">{block.title}</p> : null}
                <p className="mt-1 text-sm text-amber-950 dark:text-amber-100">{block.text}</p>
              </div>
            );
          case "best-practice":
            return (
              <div key={i} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                <span className="text-[var(--emerald)]" aria-hidden>
                  ✓
                </span>
                <div>
                  {block.title ? <p className="text-xs font-semibold uppercase text-[var(--text-subtle)]">{block.title}</p> : null}
                  <p className="text-sm text-[var(--text-muted)]">{block.text}</p>
                </div>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
