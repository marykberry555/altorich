"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Bookmark } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getKnowledgeArticle } from "@/content/knowledge";
import { getStoredProgress } from "./KnowledgeBookmarkButton";

export function KnowledgeProgressPanel() {
  const [stats, setStats] = useState({ read: 0, bookmarks: 0, recent: [] as string[] });

  useEffect(() => {
    const { read, bookmarks, recent } = getStoredProgress();
    setStats({ read: read.length, bookmarks: bookmarks.length, recent: recent.slice(0, 3) });
  }, []);

  const nextSlug = stats.recent.find((slug) => {
    const progress = getStoredProgress();
    return !progress.read.includes(slug);
  });

  const nextArticle = nextSlug ? getKnowledgeArticle(nextSlug) : null;

  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center gap-2">
        <BookOpen size={16} className="text-[var(--emerald)]" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Your learning</h2>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-[var(--text-subtle)]">Articles read</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-[var(--heading)]">{stats.read}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-subtle)]">Saved</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-[var(--heading)]">{stats.bookmarks}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-xs text-[var(--text-subtle)]">Progress</dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--emerald)]">
            {stats.read > 0 ? "Keep going" : "Start learning"}
          </dd>
        </div>
      </dl>
      {nextArticle ? (
        <div className="mt-4 rounded-xl border border-[var(--border)] px-4 py-3">
          <p className="text-xs font-semibold uppercase text-[var(--text-subtle)]">Continue reading</p>
          <Link href={nextArticle.path} className="mt-1 block text-sm font-semibold text-[var(--emerald)] hover:underline">
            {nextArticle.title}
          </Link>
        </div>
      ) : null}
      {stats.bookmarks > 0 ? (
        <p className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <Bookmark size={12} aria-hidden />
          Bookmarks are saved on this device
        </p>
      ) : null}
    </Card>
  );
}
