"use client";

import { useState } from "react";
import { Megaphone, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AdminAnnouncementDraft, AnnouncementDraftCategory } from "@/lib/admin-ops/types";

const CATEGORIES: { id: AnnouncementDraftCategory; label: string }[] = [
  { id: "general", label: "General" },
  { id: "maintenance", label: "Maintenance" },
  { id: "security", label: "Security" },
  { id: "promotion", label: "Promotions" },
  { id: "education", label: "Education" },
  { id: "urgent", label: "Urgent notices" }
];

const DRAFT_KEY = "alto-admin-announcement-drafts";

export function AdminAnnouncementCenter() {
  const [category, setCategory] = useState<AnnouncementDraftCategory>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");

  function saveDraft() {
    if (!title.trim() || !body.trim()) {
      setMessage("Title and body are required.");
      return;
    }
    const draft: AdminAnnouncementDraft = {
      id: crypto.randomUUID(),
      category,
      title: title.trim(),
      body: body.trim(),
      scheduledAt: scheduledAt || null,
      createdAt: new Date().toISOString()
    };
    try {
      const existing = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "[]") as AdminAnnouncementDraft[];
      localStorage.setItem(DRAFT_KEY, JSON.stringify([draft, ...existing].slice(0, 20)));
      setMessage("Draft saved locally. Publishing to members requires backend integration.");
      setTitle("");
      setBody("");
      setScheduledAt("");
    } catch {
      setMessage("Could not save draft.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-5">
        <div className="flex items-center gap-2">
          <Megaphone size={18} className="text-emerald-400" />
          <h2 className="font-semibold text-white">Create announcement</h2>
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Draft and preview announcements. Scheduled publishing architecture is ready for backend connection.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block text-xs text-zinc-500">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AnnouncementDraftCategory)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-zinc-500">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Body
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Schedule (optional)
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setPreview(true)}>
            <Eye size={14} /> Preview
          </Button>
          <Button size="sm" variant="outline" onClick={saveDraft}>
            Save draft
          </Button>
        </div>
        {message ? <p className="mt-3 text-xs text-emerald-400">{message}</p> : null}
      </section>

      {preview ? (
        <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5" aria-label="Announcement preview">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Preview</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{title || "Untitled"}</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">{body || "No content yet."}</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setPreview(false)}>
            Close preview
          </Button>
        </section>
      ) : (
        <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-5">
          <h2 className="font-semibold text-white">Publishing notes</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-400">
            <li>Drafts are stored locally until a publish API is connected.</li>
            <li>Member-facing announcements appear in the Announcement Centre when published.</li>
            <li>Urgent notices should be reviewed before scheduling.</li>
          </ul>
        </section>
      )}
    </div>
  );
}
