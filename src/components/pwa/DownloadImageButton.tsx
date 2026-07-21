"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { usePwaOptional } from "@/components/pwa/PwaProvider";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function DownloadImageButton({ className }: Props) {
  const pwa = usePwaOptional();

  const handleDownload = useCallback(async () => {
    if (pwa?.isStandalone) {
      window.location.href = "/auth/login";
      return;
    }

    if (pwa?.canInstall) {
      // Let the tap animation finish, then show the native bottom install sheet (not the rich modal).
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      const accepted = await pwa.promptInstall();
      if (accepted) return;
    }

    document.getElementById("install-steps")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [pwa]);

  if (pwa?.isStandalone) {
    return (
      <Link
        href="/app"
        className={cn("inline-block w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)]", className)}
        aria-label="Open Alto Rich app"
      >
        <Image
          src="/images/download.webp"
          alt="Open Alto Rich"
          width={936}
          height={263}
          priority
          unoptimized
          className="h-auto w-full transition duration-300 hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
        />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      className={cn(
        "block w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] transition duration-300",
        "hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--emerald-mid)]",
        className
      )}
      aria-label="Download Alto Rich app"
    >
      <Image
        src="/images/download.webp"
        alt="Download Alto Rich — Invest Smarter. Earn More."
        width={936}
        height={263}
        priority
        unoptimized
        className="h-auto w-full select-none rounded-[var(--radius-lg)]"
      />
    </button>
  );
}
