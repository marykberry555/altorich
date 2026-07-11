"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const deviceFingerprint = useDeviceFingerprint();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        setLoading(false);
        return;
      }

      if (data.requiresDeviceOtp) {
        setPendingEmail(data.email);
        setOtpOpen(true);
        setLoading(false);
        return;
      }

      router.push(data.redirect ?? redirect);
      router.refresh();
      trackSmartsuppEvent(SMARTSUPP_EVENTS.LOGIN);
      refreshSmartsuppIdentity();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function verifyDeviceOtp(code: string) {
    const res = await fetch("/api/auth/verify-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: pendingEmail,
        code,
        deviceFingerprint,
        userAgent: navigator.userAgent
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Verification failed.");
    setOtpOpen(false);
    router.push(data.redirect ?? redirect);
    router.refresh();
    trackSmartsuppEvent(SMARTSUPP_EVENTS.LOGIN);
    refreshSmartsuppIdentity();
  }

  return (
    <AuthShell>
      <Card variant="elevated" padding="lg" className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)]">Sign in</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Use your username and 6-digit pin to access your account.</p>
        </div>

        <form onSubmit={handleLogin} className="grid gap-3">
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required autoComplete="username" />
          <PinField
            value={pin}
            onChange={setPin}
            autoComplete="current-password"
          />
          <div className="flex justify-between text-xs">
            <Link href="/auth/forgot-username" className="font-semibold text-[var(--emerald)]">
              Forgot username?
            </Link>
            <Link href="/auth/forgot-pin" className="font-semibold text-[var(--emerald)]">
              Forgot pin?
            </Link>
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
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
        onClose={() => setOtpOpen(false)}
      />
    </AuthShell>
  );
}
