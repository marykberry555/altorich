"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const AVATAR_UPDATED_EVENT = "altorich:avatar-updated";

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  size?: "md" | "lg";
  className?: string;
};

export function AvatarUpload({ fullName, avatarUrl, size = "md", className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl ?? null);

  useEffect(() => {
    setPreviewUrl(avatarUrl ?? null);
  }, [avatarUrl]);
  const dim = size === "lg" ? "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" : "h-11 w-11";

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      const url = (data.url as string) ?? null;
      if (url) {
        setPreviewUrl(url);
        window.dispatchEvent(new CustomEvent(AVATAR_UPDATED_EVENT, { detail: { url } }));
      }
    } catch {
      setError("Could not upload photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "group relative overflow-hidden rounded-2xl ring-2 ring-[var(--emerald)]/25 transition hover:ring-[var(--emerald)]/50 focus:outline-none focus:ring-[var(--emerald)]",
          dim
        )}
        aria-label="Update profile photo"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[var(--emerald-soft)] text-[var(--emerald)]">
            <Camera size={size === "lg" ? 24 : 18} aria-hidden />
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-white" aria-hidden />
          ) : (
            <Camera size={20} className="text-white" aria-hidden />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      {error ? <p className="absolute -bottom-5 left-0 text-[10px] text-red-600">{error}</p> : null}
    </div>
  );
}
