"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--surface)] px-4">
      <Card variant="elevated" padding="lg" className="max-w-md text-center">
        <WifiOff className="mx-auto text-[var(--emerald)]" size={40} aria-hidden />
        <h1 className="mt-4 text-xl font-bold text-[var(--heading)]">You&apos;re offline</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          AltoRich needs a connection for login, investments, and payouts. Cached pages may still be available when you reconnect.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button type="button" onClick={() => window.location.reload()}>
            Try again
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              Open dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
