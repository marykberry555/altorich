"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVATAR_UPDATED_EVENT } from "@/components/profile/AvatarUpload";

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  variant?: "default" | "sidebar";
};

const sizes = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-16 w-16"
};

export function MemberAvatar({
  fullName,
  avatarUrl,
  size = "md",
  href = "/profile",
  className,
  variant = "default"
}: Props) {
  const [url, setUrl] = useState(avatarUrl ?? null);
  const dim = sizes[size];
  const onSidebar = variant === "sidebar";

  useEffect(() => {
    setUrl(avatarUrl ?? null);
  }, [avatarUrl]);

  useEffect(() => {
    function onAvatarUpdated(event: Event) {
      const detail = (event as CustomEvent<{ url?: string }>).detail;
      if (detail?.url) setUrl(detail.url);
    }
    window.addEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
    return () => window.removeEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
  }, []);

  const avatar = (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1",
        onSidebar ? "bg-white/10 ring-white/20" : "bg-[var(--gray-100)] ring-[var(--border)]",
        dim,
        className
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={cn(onSidebar ? "text-[var(--emerald-light)]" : "text-[var(--emerald)]")}>
          <Camera size={size === "sm" ? 14 : size === "md" ? 16 : 20} aria-hidden />
        </span>
      )}
    </span>
  );

  if (!href) return avatar;

  return (
    <Link href={href} className="shrink-0 transition hover:opacity-90" aria-label={`Open profile for ${fullName}`}>
      {avatar}
    </Link>
  );
}
