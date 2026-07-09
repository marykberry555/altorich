"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { OtpModal } from "@/components/auth/OtpModal";
import { MathChallenge, useMathChallenge } from "@/components/ui/MathChallenge";
import { isSupabaseConfigured } from "@/lib/env";
import { COMPANY } from "@/lib/company";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const math = useMathChallenge();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    if (!math.solved) return;
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, email, phone, pin, referralCode: referralCode || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        setLoading(false);
        return;
      }
      setOtpOpen(true);
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function verifyOtp(code: string) {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Verification failed.");
    setOtpOpen(false);
    router.push(data.redirect ?? "/dashboard");
    router.refresh();
  }

  return (
    <AuthShell>
      <Card variant="elevated" padding="lg" className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)]">Create your account</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Secure onboarding with email verification and a personal 6-digit pin.</p>
        </div>

        <form onSubmit={handleRegister} className="grid gap-3">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            hint="3–24 characters: letters, numbers, underscore"
          />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="080..." />
          <Input
            label="6-digit pin"
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
          <Input label="Referral code (optional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} />
          <MathChallenge challenge={math.challenge} answer={math.answer} onAnswerChange={math.setAnswer} />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading || !math.solved} className="w-full">
            {loading ? "Creating account…" : "Continue"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-[var(--emerald)]">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-[10px] text-[var(--text-subtle)]">
          {COMPANY.legalName} · Co. {COMPANY.companyNumber}
        </p>
      </Card>

      <OtpModal
        open={otpOpen}
        title="Verify your email"
        description={`Enter the 6-digit code sent to ${email}, or use the link in your inbox.`}
        onVerify={verifyOtp}
      />
    </AuthShell>
  );
}
