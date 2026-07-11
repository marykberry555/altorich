"use client";

import { DownloadAppBadge } from "@/components/pwa/DownloadAppBadge";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** @deprecated Use DownloadAppBadge — kept for existing imports */
export function DownloadAppButton({ size = "sm", className }: Props) {
  return <DownloadAppBadge size={size} className={className} />;
}
