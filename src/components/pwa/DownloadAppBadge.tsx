"use client";

import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { usePwaOptional } from "@/components/pwa/PwaProvider";
import { isIosDevice } from "@/lib/pwa/runtime";
import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
  tone?: "dark" | "light";
  /** When true, show install instructions inline after tap if prompt unavailable */
  showInstructionsOnFallback?: boolean;
};

const sizes = {
  sm: { pad: "px-3 py-2 gap-2", icon: 16, text: "text-xs" },
  md: { pad: "px-4 py-2.5 gap-2.5", icon: 18, text: "text-sm" },
  lg: { pad: "px-5 py-3 gap-3", icon: 20, text: "text-base" }
} as const;

function InstallInstructions() {
  const ios = isIosDevice();
  return (
    <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-50)] p-4 text-left text-sm text-[var(--text-muted)]">
      <p className="font-semibold text-[var(--heading)]">How to install</p>
      {ios ? (
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Open this page in Safari.</li>
          <li>Tap Share at the bottom of the screen.</li>
          <li>Tap Add to Home Screen, then Add.</li>
          <li>Open AltoRich from your home screen and log in.</li>
        </ol>
      ) : (
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Tap the menu (⋮) in Chrome or Samsung Internet.</li>
          <li>Choose Install app or Add to Home screen.</li>
          <li>Confirm installation.</li>
          <li>Open AltoRich and log in.</li>
        </ol>
      )}
    </div>
  );
}

export function DownloadAppBadge({ size = "md", className, tone = "dark", showInstructionsOnFallback = false }: Props) {
  const pwa = usePwaOptional();
  const [showHelp, setShowHelp] = useState(false);
  const spec = sizes[size];
  const shellClass =
    tone === "light"
      ? "bg-white text-[var(--navy)] shadow-[var(--shadow-sm)] hover:bg-white/95"
      : "bg-[var(--navy)] text-white shadow-[var(--shadow-md)] hover:brightness-110";

  const handleDownload = useCallback(async () => {
    if (pwa?.canInstall) {
      const ok = await pwa.promptInstall();
      if (!ok && showInstructionsOnFallback) setShowHelp(true);
      return;
    }
    if (showInstructionsOnFallback) setShowHelp(true);
  }, [pwa, showInstructionsOnFallback]);

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

  const badge = (
    <button
      type="button"
      onClick={() => void handleDownload()}
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] transition",
        shellClass,
        spec.pad,
        className
      )}
    >
      <Download size={spec.icon} aria-hidden />
      <span className={cn("font-semibold", spec.text)}>Download App</span>
    </button>
  );

  if (pwa?.canInstall && !showInstructionsOnFallback) {
    return badge;
  }

  if (!showInstructionsOnFallback) {
    return (
      <Link href="/download" className={cn("inline-flex", className)}>
        <span
          className={cn(
            "inline-flex items-center rounded-[var(--radius-sm)] transition",
            shellClass,
            spec.pad
          )}
        >
          <Download size={spec.icon} aria-hidden />
          <span className={cn("font-semibold", spec.text)}>Download App</span>
        </span>
      </Link>
    );
  }

  return (
    <div className={className}>
      {badge}
      {showHelp ? <InstallInstructions /> : null}
    </div>
  );
}

export { InstallInstructions };
