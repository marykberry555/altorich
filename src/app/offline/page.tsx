"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { COMPANY } from "@/lib/company";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-5 bg-[var(--surface)] px-4 py-16 text-center">
      <BrandLogo variant="icon" href="/" />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Alto Rich</p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)]">Reconnecting securely</h1>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          We&apos;re waiting for your connection to return. This page will continue automatically when you&apos;re back
          online.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => window.location.reload()}>
          Refresh page
        </Button>
        <Link href="/dashboard">
          <Button type="button" variant="outline">
            Return to dashboard
          </Button>
        </Link>
        <a href={`mailto:${COMPANY.supportEmail}`}>
          <Button type="button" variant="ghost">
            Contact support
          </Button>
        </a>
      </div>
    </main>
  );
}
