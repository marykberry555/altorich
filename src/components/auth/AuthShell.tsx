"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { IMAGES } from "@/lib/images";
import { Badge } from "@/components/ui/Badge";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[var(--surface)]">
      <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between sm:left-6 sm:right-6 sm:top-6">
        <BrandLogo variant="icon" href="/" />
        <div className="flex items-center gap-3">
          <ThemeToggle compact />
          <Link href="/" className="text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--emerald)]">
            Home
          </Link>
        </div>
      </div>

      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-stretch gap-10 px-4 pb-12 pt-24 sm:px-6 lg:grid-cols-2 lg:gap-0 lg:pt-24">
        <aside className="hidden lg:flex lg:flex-col lg:justify-between lg:pr-14">
          <div className="animate-fade-up">
            <Badge variant="gold">Secure · Verified</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--heading)]">
              Banking-grade discipline for modern wealth builders.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
              Verified contributions, clear processing windows, and an auditable wallet ledger — built for clarity, not hype.
            </p>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-lg)]">
            <Image
              src={IMAGES.hero.src}
              alt={IMAGES.hero.alt}
              width={960}
              height={720}
              className="h-[420px] w-full object-cover"
              priority
              sizes="(max-width: 1024px) 0px, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="grid gap-2 rounded-[var(--radius)] border border-white/10 bg-black/25 p-4 text-white backdrop-blur">
                <p className="text-sm font-semibold">Transparent by design</p>
                <p className="text-xs text-white/80">
                  Deposits are verified before wallet credit. Withdrawals follow published windows.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center lg:pl-14">
          <div className="w-full max-w-md animate-fade-up">
            <div className="mb-6 flex items-center justify-center lg:hidden">
              <BrandLogo variant="full" priority href="/" />
            </div>
            {children}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--surface)] to-transparent" />
    </div>
  );
}
