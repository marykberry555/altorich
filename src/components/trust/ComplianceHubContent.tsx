"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { COMPLIANCE_DOCUMENTS, searchComplianceDocuments } from "@/lib/trust/compliance-catalog";

export function ComplianceHubContent() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchComplianceDocuments(query), [query]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search policies and legal documents…"
          className="pl-9"
          aria-label="Search compliance documents"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((doc) => (
          <Card key={doc.id} variant="elevated" padding="md" className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-[var(--heading)]">{doc.title}</h2>
              <span className="rounded-full bg-[var(--gray-100)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--text-subtle)]">
                {doc.category}
              </span>
            </div>
            <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">{doc.summary}</p>
            <Link href={doc.href} className="mt-4 inline-block">
              <Button size="sm" variant="outline">
                Read document
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No documents match your search.</p>
      ) : null}

      <section id="regulatory-notices" className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--emerald)]" aria-hidden />
          <h2 className="font-semibold text-[var(--heading)]">Future regulatory notices</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Official regulatory updates and mandatory notices will be published here and surfaced in your member
          announcements when applicable. No active regulatory notices at this time.
        </p>
      </section>

      {!query && (
        <p className="text-xs text-[var(--text-subtle)]">
          Showing {COMPLIANCE_DOCUMENTS.length} documents in the compliance library.
        </p>
      )}
    </div>
  );
}
