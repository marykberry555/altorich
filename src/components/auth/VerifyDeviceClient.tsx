"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useDeviceFingerprint } from "@/lib/auth/use-device-fingerprint";

function completeSignIn(redirect: string) {
  window.location.assign(redirect);
}

export function VerifyDeviceClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  const deviceFingerprint = useDeviceFingerprint();

  const [status, setStatus] = useState<"working" | "error" | "done">("working");
  const [message, setMessage] = useState("Verifying this device…");

  useEffect(() => {
    if (!email || !token) {
      setStatus("error");
      setMessage("This verification link is incomplete. Request a new code from the sign-in page.");
      return;
    }
    if (!deviceFingerprint || deviceFingerprint === "fp_server") {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            email,
            code: token,
            deviceFingerprint,
            userAgent: navigator.userAgent
          })
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error ?? "This verification link is invalid or has expired.");
          return;
        }

        setStatus("done");
        setMessage("Device verified. Redirecting…");
        completeSignIn(data.redirect ?? "/dashboard");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("We could not verify this device. Please try signing in again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, token, deviceFingerprint]);

  return (
    <AuthShell>
      <Card variant="elevated" padding="lg" className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)]">Verify device</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{message}</p>
        {status === "error" ? (
          <div className="mt-6">
            <Link href="/auth/login">
              <Button className="w-full">Back to sign in</Button>
            </Link>
          </div>
        ) : null}
      </Card>
    </AuthShell>
  );
}
