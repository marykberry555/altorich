import Link from "next/link";
import { Download, FileText, FolderOpen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/member-experience/documents";
import type { DocumentItem } from "@/lib/member-experience/types";
import { cn } from "@/lib/utils";

type Props = {
  documents: DocumentItem[];
  className?: string;
};

export function PersonalDocumentsHub({ documents, className }: Props) {
  const categories = [...new Set(documents.map((d) => d.category))];

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--emerald)]/10 text-[var(--emerald)]">
          <FolderOpen size={20} aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--heading)]">My documents</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Statements, reports, and account records. Additional formats will appear here as they become available.
          </p>
        </div>
      </div>

      {categories.map((category) => {
        const items = documents.filter((d) => d.category === category);
        return (
          <section key={category} aria-labelledby={`doc-cat-${category}`}>
            <h2 id={`doc-cat-${category}`} className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              {DOCUMENT_CATEGORY_LABELS[category]}
            </h2>
            <ul className="mt-3 space-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <Card variant="elevated" padding="md">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <FileText size={18} className="mt-0.5 shrink-0 text-[var(--emerald)]" aria-hidden />
                        <div>
                          <p className="font-semibold text-[var(--heading)]">{item.title}</p>
                          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{item.description}</p>
                        </div>
                      </div>
                      {item.available && item.href ? (
                        item.href.startsWith("/api/") ? (
                          <a href={item.href} download>
                            <Button size="sm" variant="outline" className="gap-1.5">
                              <Download size={14} aria-hidden />
                              Download
                            </Button>
                          </a>
                        ) : (
                          <Link href={item.href}>
                            <Button size="sm" variant="outline">
                              Open
                            </Button>
                          </Link>
                        )
                      ) : (
                        <Button size="sm" variant="outline" disabled className="gap-1.5">
                          <Download size={14} aria-hidden />
                          Not available
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
