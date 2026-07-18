"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getInitials, AVATAR_UPDATED_EVENT } from "@/lib/avatar/display";

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  href?: string | null;
  className?: string;
  variant?: "default" | "sidebar";
};

const sizes = {
  sm: "h-9 w-9 text-[10px]",
  md: "h-11 w-11 text-xs",
  lg: "h-16 w-16 text-sm",
  xl: "h-20 w-20 text-base sm:h-24 sm:w-24 sm:text-lg"
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
  const [failed, setFailed] = useState(false);
  const dim = sizes[size];
  const onSidebar = variant === "sidebar";
  const initials = getInitials(fullName);

  useEffect(() => {
    setUrl(avatarUrl ?? null);
    setFailed(false);
  }, [avatarUrl]);

  useEffect(() => {
    function onAvatarUpdated(event: Event) {
      const detail = (event as CustomEvent<{ url?: string }>).detail;
      if (detail?.url) {
        setUrl(detail.url);
        setFailed(false);
      }
    }
    window.addEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
    return () => window.removeEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
  }, []);

  const showImage = Boolean(url) && !failed;

  const avatar = (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ring-1",
        onSidebar ? "bg-white/10 text-white ring-white/20" : "bg-[var(--emerald-soft)] text-[var(--emerald)] ring-[var(--border)]",
        dim,
        className
      )}
      aria-hidden={showImage ? undefined : true}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url!}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="select-none">{initials}</span>
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
