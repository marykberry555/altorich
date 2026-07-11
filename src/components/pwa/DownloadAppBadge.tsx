"use client";

import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePwaOptional } from "@/components/pwa/PwaProvider";
import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
  tone?: "dark" | "light";
};

const sizes = {
  sm: { pad: "px-3 py-2 gap-2", icon: 16, text: "text-xs" },
  md: { pad: "px-4 py-2.5 gap-2.5", icon: 18, text: "text-sm" },
  lg: { pad: "px-5 py-3 gap-3", icon: 20, text: "text-base" }
} as const;

export function DownloadAppBadge({ size = "md", className, tone = "dark" }: Props) {
  const pwa = usePwaOptional();
  const spec = sizes[size];
  const shellClass =
    tone === "light"
      ? "bg-white text-[var(--emerald)] ring-1 ring-white/30 shadow-[var(--shadow-sm)] hover:bg-white/95"
      : "bg-[var(--emerald)] text-white shadow-[var(--shadow-md)] hover:brightness-110";

  if (pwa?.isStandalone) {
    return (
      <Link
        href="/app"
        className={cn(
          "inline-flex items-center rounded-[var(--radius-sm)] transition",
          shellClass,
          spec.pad,
          className
        )}
      >
        <ExternalLink size={spec.icon} aria-hidden />
        <span className={cn("font-semibold", spec.text)}>Open App</span>
      </Link>
    );
  }

  return (
    <Link
      href="/download"
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] transition",
        shellClass,
        spec.pad,
        className
      )}
    >
      <Download size={spec.icon} aria-hidden />
      <span className={cn("font-semibold", spec.text)}>Download App</span>
    </Link>
  );
}
