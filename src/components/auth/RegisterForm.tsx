"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { OtpModal } from "@/components/auth/OtpModal";
import { PinField } from "@/components/ui/PinField";
import { MathChallenge, useMathChallenge } from "@/components/ui/MathChallenge";
import { isSupabaseConfigured } from "@/lib/env";
import { COMPANY } from "@/lib/company";
import type { PackageSlug } from "@/content/packages";
import { PackageSelectionField } from "@/components/auth/PackageSelectionField";
import { FormFlashError, useFlashError } from "@/components/ui/FormFlashError";
import { capPhoneInput, DUPLICATE_IDENTITY_MESSAGE, WEAK_PASSWORD_MESSAGE } from "@/lib/validation/identity";

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
  const [preferredPackage, setPreferredPackage] = useState<PackageSlug | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useFlashError();
  const [otpOpen, setOtpOpen] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    if (!math.solved) return;
    if (!preferredPackage) {
      setError("Select a package.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Registration is temporarily unavailable. Please try again shortly.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          username,
          email,
          phone,
          pin,
          referralCode: referralCode || undefined,
          preferredPackage
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.code === "IDENTITY_TAKEN" || /already exists|already registered|already taken/i.test(data.error ?? "")
            ? DUPLICATE_IDENTITY_MESSAGE
            : data.code === "WEAK_PASSWORD"
              ? WEAK_PASSWORD_MESSAGE
              : (data.error ?? "Registration failed.");
        setError(msg);
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
        </div>

        <form onSubmit={handleRegister} className="grid gap-3">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
          />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Phone number" value={phone} onChange={(e) => setPhone(capPhoneInput(e.target.value))} required placeholder="08012345678" maxLength={11} inputMode="numeric" />
          <PackageSelectionField value={preferredPackage} onChange={setPreferredPackage} disabled={loading} />
          <PinField value={pin} onChange={setPin} autoComplete="new-password" />
          <Input label="Referral code (optional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} />
          <MathChallenge challenge={math.challenge} answer={math.answer} onAnswerChange={math.setAnswer} />
          {error ? <FormFlashError message={error} /> : null}
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
