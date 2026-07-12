"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PinField } from "@/components/ui/PinField";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { OtpModal } from "@/components/auth/OtpModal";
import { useDeviceFingerprint } from "@/lib/auth/use-device-fingerprint";
import { isSupabaseConfigured } from "@/lib/env";
import { COMPANY } from "@/lib/company";

type LoadingPhase = "idle" | "signing-in" | "authenticating" | "redirecting";

const SLOW_LOGIN_MS = 8000;

function completeSignIn(redirect: string) {
  window.location.assign(redirect);
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const deviceFingerprint = useDeviceFingerprint();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [phase, setPhase] = useState<LoadingPhase>("idle");
  const [error, setError] = useState("");
  const [slowMessage, setSlowMessage] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const loading = phase !== "idle";

  useEffect(() => {
    if (!loading) {
      setSlowMessage(false);
      return;
    }
    const timer = window.setTimeout(() => setSlowMessage(true), SLOW_LOGIN_MS);
    return () => window.clearTimeout(timer);
  }, [loading]);

  function resolveRedirect(apiRedirect: string) {
    if (redirectParam && !redirectParam.startsWith("/auth")) {
      if (apiRedirect === "/dashboard" || apiRedirect === "/hard") {
        return redirectParam;
      }
    }
    return apiRedirect;
  }

  async function handleUsernameLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Sign-in is temporarily unavailable. Please try again shortly.");
      return;
    }

    setPhase("signing-in");
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          username,
          pin,
          deviceFingerprint,
          userAgent: navigator.userAgent
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        setPhase("idle");
        return;
      }

      if (data.requiresDeviceOtp) {
        setPendingEmail(data.email);
        setOtpOpen(true);
        setPhase("idle");
        return;
      }

      setPhase("redirecting");
      completeSignIn(resolveRedirect(data.redirect ?? "/dashboard"));
    } catch {
      setError("Network error. Please try again.");
      setPhase("idle");
    }
  }

  async function verifyDeviceOtp(code: string) {
    setPhase("authenticating");
    setError("");

    const res = await fetch("/api/auth/verify-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        email: pendingEmail,
        code,
        deviceFingerprint,
        userAgent: navigator.userAgent
      })
    });
    const data = await res.json();

    if (!res.ok) {
      setPhase("idle");
      throw new Error(data.error ?? "Verification failed.");
    }

    setOtpOpen(false);
    setPhase("redirecting");
    completeSignIn(resolveRedirect(data.redirect ?? "/dashboard"));
  }

  const submitLabel =
    phase === "signing-in"
      ? "Signing in..."
      : phase === "authenticating"
        ? "Authenticating..."
        : phase === "redirecting"
          ? "Redirecting..."
          : "Sign in";

  return (
    <AuthShell>
      <Card variant="elevated" padding="lg" className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)]">Sign in</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Enter your username and 6-digit PIN to access your account.</p>
        </div>

        <form onSubmit={handleUsernameLogin} className="grid gap-3">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            autoComplete="username"
          />
          <PinField value={pin} onChange={setPin} autoComplete="current-password" />
          <div className="flex justify-between text-xs">
            <Link href="/auth/forgot-username" className="font-semibold text-[var(--emerald)]">
              Forgot username?
            </Link>
            <Link href="/auth/forgot-pin" className="font-semibold text-[var(--emerald)]">
              Forgot pin?
            </Link>
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          {slowMessage && loading ? (
            <p className="text-xs text-[var(--text-muted)]">Still working — please wait a moment.</p>
          ) : null}
          <Button type="submit" disabled={loading} className="w-full">
            {submitLabel}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
          No account?{" "}
          <Link href="/auth/register" className="font-semibold text-[var(--emerald)]">
            Create one
          </Link>
        </p>

        <p className="mt-4 text-center text-[10px] text-[var(--text-subtle)]">
          {COMPANY.legalName} · Co. {COMPANY.companyNumber}
        </p>
      </Card>

      <OtpModal
        open={otpOpen}
        title="Verify this device"
        description={`We sent a 6-digit code to ${pendingEmail}. Enter it to complete sign-in.`}
        onVerify={verifyDeviceOtp}
        onClose={() => {
          setOtpOpen(false);
          setPhase("idle");
        }}
      />
    </AuthShell>
  );
}
