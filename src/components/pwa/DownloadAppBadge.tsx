"use client";

import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePwaOptional } from "@/components/pwa/PwaProvider";
import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** primary = filled CTA; surface = light/outline on tinted backgrounds */
  tone?: "primary" | "surface";
  label?: string;
  hideLabel?: boolean;
  disabled?: boolean;
};

const sizes = {
  sm: { pad: "px-3 py-2 gap-2", icon: 16, text: "text-xs" },
  md: { pad: "px-4 py-2.5 gap-2.5", icon: 18, text: "text-sm" },
  lg: { pad: "px-5 py-3 gap-3", icon: 20, text: "text-base" }
} as const;

export function DownloadAppBadge({
  size = "md",
  className,
  tone = "primary",
  label = "Download App",
  hideLabel = false,
  disabled = false
}: Props) {
  const pwa = usePwaOptional();
  const spec = sizes[size];

  const shellClass =
    tone === "surface"
      ? cn(
          "bg-[var(--btn-surface-bg)] text-[var(--btn-surface-fg)]",
          "ring-1 ring-[var(--btn-surface-border)] shadow-[var(--shadow-sm)]",
          "hover:bg-[var(--btn-surface-hover-bg)]",
          "active:bg-[var(--gray-200)]"
        )
      : cn(
          "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]",
          "ring-1 ring-[var(--btn-primary-border)] shadow-[var(--shadow-md)]",
          "hover:bg-[var(--btn-primary-hover-bg)]",
          "active:bg-[var(--btn-primary-active-bg)]"
        );

  const sharedClass = cn(
    "inline-flex items-center rounded-[var(--radius-sm)] font-semibold transition",
    "[&_svg]:shrink-0 [&_svg]:text-[var(--btn-primary-fg)]",
    tone === "surface" && "[&_svg]:text-[var(--btn-surface-fg)]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald-mid)]",
    "disabled:pointer-events-none disabled:opacity-50",
    shellClass,
    spec.pad,
    className
  );

  if (pwa?.isStandalone) {
    return (
      <Link href="/app" className={sharedClass} aria-label="Open Alto Rich app">
        <ExternalLink size={spec.icon} aria-hidden />
        <span className={spec.text}>Open App</span>
      </Link>
    );
  }

  return (
    <Link
      href="/download"
      className={sharedClass}
      aria-label={label}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
    >
      <Download size={spec.icon} aria-hidden />
      {hideLabel ? null : <span className={spec.text}>{label}</span>}
    </Link>
  );
}
