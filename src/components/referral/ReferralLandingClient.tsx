"use client";

import Link from "next/link";
import { useEffect } from "react";
import { persistReferralCode } from "@/components/referral/ReferralAttributionCapture";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  code: string;
  referrerName: string | null;
  invalid: boolean;
  invalidMessage: string;
  registerHref: string;
};

/** Shown to social preview bots (and invalid-link humans). Persists code for browsers that stay. */
export function ReferralLandingClient({ code, referrerName, invalid, invalidMessage, registerHref }: Props) {
  useEffect(() => {
    if (!invalid) persistReferralCode(code);
  }, [code, invalid]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-4 py-16">
      <Card variant="elevated" padding="lg" className="w-full max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--emerald)]">Alto Rich</p>
        <h1 className="mt-3 text-2xl font-bold text-[var(--heading)]">Join Alto Rich</h1>
        {invalid ? (
          <p className="mt-3 text-sm text-red-600">{invalidMessage}</p>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {referrerName ? (
              <>
                Referred by <span className="font-semibold text-[var(--heading)]">{referrerName}</span>
              </>
            ) : (
              <>
                Referral <span className="font-semibold text-[var(--heading)]">{code}</span>
              </>
            )}
          </p>
        )}
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Start building your wealth with Alto Rich. Use this referral link to join our growing investment community.
        </p>
        <Link href={invalid ? "/auth/register" : registerHref} className="mt-6 inline-block w-full">
          <Button className="w-full">{invalid ? "Create account" : "Continue to signup"}</Button>
        </Link>
      </Card>
    </main>
  );
}
