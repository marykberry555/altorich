"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const BOOKMARKS_KEY = "alto-knowledge-bookmarks";
const READ_KEY = "alto-knowledge-read";
const RECENT_KEY = "alto-knowledge-recent";

export function useKnowledgeStorage(slug: string) {
  const [bookmarked, setBookmarked] = useState(false);
  const [read, setRead] = useState(false);

  useEffect(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]") as string[];
      const readList = JSON.parse(localStorage.getItem(READ_KEY) ?? "[]") as string[];
      setBookmarked(bookmarks.includes(slug));
      setRead(readList.includes(slug));

      const recent = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
      const updated = [slug, ...recent.filter((s) => s !== slug)].slice(0, 10);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  }, [slug]);

  const toggleBookmark = useCallback(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]") as string[];
      const next = bookmarks.includes(slug) ? bookmarks.filter((s) => s !== slug) : [...bookmarks, slug];
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      setBookmarked(!bookmarked);
    } catch {
      /* ignore */
    }
  }, [slug, bookmarked]);

  const markRead = useCallback(() => {
    try {
      const readList = JSON.parse(localStorage.getItem(READ_KEY) ?? "[]") as string[];
      if (!readList.includes(slug)) {
        localStorage.setItem(READ_KEY, JSON.stringify([...readList, slug]));
        setRead(true);
      }
    } catch {
      /* ignore */
    }
  }, [slug]);

  return { bookmarked, read, toggleBookmark, markRead };
}

export function KnowledgeBookmarkButton({ slug, className }: { slug: string; className?: string }) {
  const { bookmarked, toggleBookmark } = useKnowledgeStorage(slug);
  return (
    <button
      type="button"
      onClick={toggleBookmark}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--emerald)]/40",
        bookmarked && "border-[var(--emerald)]/30 bg-[var(--emerald)]/5 text-[var(--emerald)]",
        className
      )}
      aria-pressed={bookmarked}
    >
      {bookmarked ? <BookmarkCheck size={16} aria-hidden /> : <Bookmark size={16} aria-hidden />}
      {bookmarked ? "Saved" : "Save article"}
    </button>
  );
}

export function getStoredProgress() {
  if (typeof window === "undefined") return { read: [] as string[], bookmarks: [] as string[], recent: [] as string[] };
  try {
    return {
      read: JSON.parse(localStorage.getItem(READ_KEY) ?? "[]") as string[],
      bookmarks: JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]") as string[],
      recent: JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[]
    };
  } catch {
    return { read: [], bookmarks: [], recent: [] };
  }
}
