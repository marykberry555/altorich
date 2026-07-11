"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AltoRich app route error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold text-[var(--heading)]">This page couldn&apos;t load</h1>
      <p className="text-sm text-[var(--text-muted)]">
        {error.message || "A server error occurred while loading this page."}
      </p>
      {error.digest ? (
        <p className="text-xs text-[var(--text-subtle)]">Reference: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Reload
        </Button>
        <Link href="/dashboard">
          <Button type="button" variant="outline">
            Back to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
