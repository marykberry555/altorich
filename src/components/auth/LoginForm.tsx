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
import { refreshSmartsuppIdentity, trackSmartsuppEvent } from "@/lib/chat/smartsupp";
import { SMARTSUPP_EVENTS } from "@/lib/chat/smartsupp-events";
import { cn } from "@/lib/utils";

type LoginMode = "email" | "username";
type LoadingPhase = "idle" | "signing-in" | "authenticating" | "redirecting";

const SLOW_LOGIN_MS = 8000;

function completeSignIn(redirect: string) {
  window.location.assign(redirect);
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const deviceFingerprint = useDeviceFingerprint();

  const [mode, setMode] = useState<LoginMode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function handleEmailLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      return;
    }

    setPhase("signing-in");
    setError("");

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        setPhase("idle");
        return;
      }

      setPhase("redirecting");
      trackSmartsuppEvent(SMARTSUPP_EVENTS.LOGIN);
      refreshSmartsuppIdentity();
      completeSignIn(resolveRedirect(data.redirect ?? "/dashboard"));
    } catch {
      setError("Network error. Please try again.");
      setPhase("idle");
    }
  }

  async function handleUsernameLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
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
      trackSmartsuppEvent(SMARTSUPP_EVENTS.LOGIN);
      refreshSmartsuppIdentity();
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
    trackSmartsuppEvent(SMARTSUPP_EVENTS.LOGIN);
    refreshSmartsuppIdentity();
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
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {mode === "email"
              ? "Use your email and password. Operators are routed to admin automatically."
              : "Use your username and 6-digit pin to access your member account."}
          </p>
        </div>

        <div className="mb-5 flex rounded-[var(--radius-sm)] border border-[var(--border)] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("email");
              setError("");
            }}
            className={cn(
              "flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition",
              mode === "email"
                ? "bg-[var(--emerald-soft)] text-[var(--emerald)]"
                : "text-[var(--text-muted)] hover:text-[var(--heading)]"
            )}
          >
            Email & password
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("username");
              setError("");
            }}
            className={cn(
              "flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition",
              mode === "username"
                ? "bg-[var(--emerald-soft)] text-[var(--emerald)]"
                : "text-[var(--text-muted)] hover:text-[var(--heading)]"
            )}
          >
            Username & pin
          </button>
        </div>

        {mode === "email" ? (
          <form onSubmit={handleEmailLogin} className="grid gap-3">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            {slowMessage && loading ? (
              <p className="text-xs text-[var(--text-muted)]">Still working — please wait a moment.</p>
            ) : null}
            <Button type="submit" disabled={loading} className="w-full">
              {submitLabel}
            </Button>
          </form>
        ) : (
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
        )}

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
