"use client";

import Image from "next/image";
import Link from "next/link";
import { usePwaInstallFlow } from "@/lib/pwa/use-pwa-install-flow";
import { InstallInstructions } from "@/components/pwa/DownloadAppBadge";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function DownloadImageButton({ className }: Props) {
  const { pwa, showHelp, setShowHelp, handleInstall } = usePwaInstallFlow(true);

  if (pwa?.isStandalone) {
    return (
      <Link href="/app" className={cn("inline-block w-full max-w-lg", className)} aria-label="Open Alto Rich app">
        <Image
          src="/images/download.png"
          alt="Open Alto Rich"
          width={960}
          height={240}
          priority
          className="h-auto w-full transition duration-300 hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
        />
      </Link>
    );
  }

  return (
    <div className={cn("w-full max-w-lg", className)}>
      <button
        type="button"
        onClick={() => void handleInstall()}
        className="block w-full rounded-[var(--radius-lg)] transition duration-300 hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--emerald-mid)]"
        aria-label="Download Alto Rich app"
      >
        <Image
          src="/images/download.png"
          alt="Download Alto Rich — Invest Smarter. Earn More."
          width={960}
          height={240}
          priority
          className="h-auto w-full select-none"
        />
      </button>

      {!pwa?.canInstall && !showHelp ? (
        <button
          type="button"
          className="mt-4 text-sm font-medium text-[var(--emerald)] underline-offset-2 hover:underline"
          onClick={() => setShowHelp(true)}
        >
          Don&apos;t see the install prompt?
        </button>
      ) : null}

      {showHelp && !pwa?.canInstall ? <InstallInstructions /> : null}
    </div>
  );
}
