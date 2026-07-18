"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImageForAvatar, getInitials, AVATAR_UPDATED_EVENT } from "@/lib/avatar/display";

export { AVATAR_UPDATED_EVENT };

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  size?: "md" | "lg";
  className?: string;
};

export function AvatarUpload({ fullName, avatarUrl, size = "md", className }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl ?? null);
  const [failed, setFailed] = useState(false);
  const localOverride = useRef<string | null>(null);
  const dim = size === "lg" ? "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" : "h-11 w-11";
  const initials = getInitials(fullName);

  useEffect(() => {
    // Keep a successful upload visible until the server prop catches up after refresh.
    if (localOverride.current && !avatarUrl) return;
    if (avatarUrl && localOverride.current && avatarUrl === localOverride.current) {
      localOverride.current = null;
    }
    setPreviewUrl(avatarUrl ?? localOverride.current);
    setFailed(false);
  }, [avatarUrl]);

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const compressed = await compressImageForAvatar(file);
      const form = new FormData();
      form.append("file", compressed);
      const res = await fetch("/api/uploads/avatar", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Upload failed. Use JPG, PNG, or WebP under 2MB.");
        return;
      }
      const url = typeof data.url === "string" ? data.url : null;
      if (!url) {
        setError("Upload succeeded but no photo URL was returned.");
        return;
      }
      localOverride.current = url;
      setPreviewUrl(url);
      setFailed(false);
      window.dispatchEvent(new CustomEvent(AVATAR_UPDATED_EVENT, { detail: { url } }));
      router.refresh();
    } catch {
      setError("Could not upload photo. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  const showImage = Boolean(previewUrl) && !failed;

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
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl!}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[var(--emerald-soft)] text-sm font-semibold text-[var(--emerald)]">
            {initials}
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
      {error ? <p className="absolute -bottom-5 left-0 max-w-[14rem] text-[10px] leading-tight text-red-600">{error}</p> : null}
    </div>
  );
}
