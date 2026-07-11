"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HARD_OPS_HOME } from "@/lib/hard-ops";

export default function HardOpsError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold text-[var(--heading)]">This page couldn&apos;t load</h1>
      <p className="text-sm text-[var(--text-muted)]">A server error occurred. Reload to try again.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Reload
        </Button>
        <Link href={HARD_OPS_HOME}>
          <Button type="button" variant="outline">
            Back to ops home
          </Button>
        </Link>
      </div>
    </div>
  );
}
