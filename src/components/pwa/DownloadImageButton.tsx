"use client";

import Image from "next/image";
import Link from "next/link";
import { usePwaOptional } from "@/components/pwa/PwaProvider";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function DownloadImageButton({ className }: Props) {
  const pwa = usePwaOptional();

  if (pwa?.isStandalone) {
    return (
      <Link href="/app" className={cn("inline-block w-full max-w-lg", className)} aria-label="Open Alto Rich app">
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
    <div className={cn("w-full max-w-lg", className)}>
      <Image
        src="/images/download.webp"
        alt="Download Alto Rich — Invest Smarter. Earn More."
        width={936}
        height={263}
        priority
        unoptimized
        className="h-auto w-full select-none"
      />
    </div>
  );
}
