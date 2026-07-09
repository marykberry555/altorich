"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/avatar";

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
  const initials = getInitials(fullName);
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
      router.refresh();
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
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[var(--emerald-soft)] text-base font-semibold text-[var(--emerald)]">
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
        className="sr-only"
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
