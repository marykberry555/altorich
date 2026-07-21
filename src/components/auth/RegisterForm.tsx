"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { OtpModal } from "@/components/auth/OtpModal";
import { PinField } from "@/components/ui/PinField";
import { MathChallenge, useMathChallenge } from "@/components/ui/MathChallenge";
import { isSupabaseConfigured } from "@/lib/env";
import { COMPANY } from "@/lib/company";
import type { PortfolioSlug } from "@/config/investment-portfolios";
import { PORTFOLIO_TERMS } from "@/lib/copy/portfolio-terminology";
import { PackageSelectionField } from "@/components/auth/PackageSelectionField";
import { LocationFields } from "@/components/location/LocationFields";
import { FormFlashError, useFlashError } from "@/components/ui/FormFlashError";
import { WelcomeBonusSlotCounter } from "@/components/welcome-bonus/WelcomeBonusSlotCounter";
import { capPhoneInput, DUPLICATE_IDENTITY_MESSAGE, WEAK_PASSWORD_MESSAGE } from "@/lib/validation/identity";
import type { NgStateCode } from "@/lib/location/ng-locations";
import {
  REFERRAL_INVALID_MESSAGE,
  normalizeReferralCode,
  referralCodeFromSearchParams
} from "@/lib/referral/attribution";
import {
  persistReferralCode,
  readStoredReferralCode
} from "@/components/referral/ReferralAttributionCapture";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const math = useMathChallenge();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [referralLocked, setReferralLocked] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [preferredPackage, setPreferredPackage] = useState<PortfolioSlug | "">("");
  const [locationStateCode, setLocationStateCode] = useState<NgStateCode | "">("");
  const [locationCityArea, setLocationCityArea] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useFlashError();

  const [otpOpen, setOtpOpen] = useState(false);

  useEffect(() => {
    const fromUrl = referralCodeFromSearchParams(searchParams);
    const fromStore = readStoredReferralCode();
    const code = fromUrl ?? fromStore;
    if (!code) return;
    persistReferralCode(code);
    setReferralCode(code);
    setReferralLocked(Boolean(fromUrl || fromStore));

    let cancelled = false;
    fetch(`/api/referrals/lookup?code=${encodeURIComponent(code)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setReferrerName(null);
          setReferralLocked(false);
          setReferralError(typeof data.error === "string" ? data.error : REFERRAL_INVALID_MESSAGE);
          return;
        }
        setReferralError("");
        setReferrerName(typeof data.referrerName === "string" ? data.referrerName : null);
        if (typeof data.code === "string") {
          setReferralCode(data.code);
          persistReferralCode(data.code);
        }
      })
      .catch(() => {
        if (!cancelled) setReferralError("");
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    if (!math.solved) return;
    if (!acceptedTerms) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }
    if (!preferredPackage) {
      setError(`Select a preferred ${PORTFOLIO_TERMS.portfolio.toLowerCase()}.`);
      return;
    }
    if (!locationStateCode || !locationCityArea) {
      setError("Select your state and city / area.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Registration is temporarily unavailable. Please try again shortly.");
      return;
    }

    const normalizedReferral = normalizeReferralCode(referralCode);
    if (referralCode.trim() && !normalizedReferral) {
      setError(REFERRAL_INVALID_MESSAGE);
      return;
    }
    if (referralError && normalizedReferral) {
      setError(referralError);
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
          referralCode: normalizedReferral || undefined,
          preferredPackage,
          locationStateCode,
          locationCityArea
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.code === "IDENTITY_TAKEN" || /already exists|already registered|already taken/i.test(data.error ?? "")
            ? DUPLICATE_IDENTITY_MESSAGE
            : data.code === "WEAK_PASSWORD"
              ? WEAK_PASSWORD_MESSAGE
              : data.code === "REFERRAL_INVALID" || data.code === "REFERRAL_EXPIRED" || data.code === "REFERRAL_SELF"
                ? (data.error ?? REFERRAL_INVALID_MESSAGE)
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
    window.setTimeout(() => {
      window.location.assign(data.redirect ?? "/dashboard");
    }, 1400);
  }

  return (
    <AuthShell>
      <Card variant="elevated" padding="lg" className="w-full">
        <div className="mb-6 space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)]">Create your account</h1>
          <WelcomeBonusSlotCounter compact />
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
          <Input
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(capPhoneInput(e.target.value))}
            required
            placeholder="08012345678"
            maxLength={11}
            inputMode="numeric"
          />
          <LocationFields
            stateCode={locationStateCode}
            cityArea={locationCityArea}
            onStateChange={setLocationStateCode}
            onCityChange={setLocationCityArea}
            disabled={loading}
          />
          <PackageSelectionField value={preferredPackage} onChange={setPreferredPackage} disabled={loading} />
          <PinField label="Choose 6-digit pin" value={pin} onChange={setPin} autoComplete="new-password" />

          {referralLocked && referralCode && !referralError ? (
            <div className="rounded-[var(--radius-sm)] border border-[var(--emerald)]/30 bg-[var(--emerald-soft)]/40 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">
                {referrerName ? "Referred by" : "Referral"}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--heading)]">
                {referrerName ?? referralCode}
              </p>
              {referrerName ? (
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">Code {referralCode}</p>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Input
                label="Referral code (optional)"
                value={referralCode}
                onChange={(e) => {
                  const next = e.target.value.toUpperCase();
                  setReferralCode(next);
                  setReferralLocked(false);
                  setReferralError("");
                  setReferrerName(null);
                  const normalized = normalizeReferralCode(next);
                  if (normalized) persistReferralCode(normalized);
                }}
              />
              {referralError ? <p className="text-xs text-red-600">{referralError}</p> : null}
            </div>
          )}

          <MathChallenge challenge={math.challenge} answer={math.answer} onAnswerChange={math.setAnswer} />
          <fieldset className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
            <legend className="px-1 text-sm font-medium text-[var(--heading)]">Terms of Service</legend>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--text-muted)]">
              <input
                type="radio"
                name="accept-terms"
                value="accepted"
                checked={acceptedTerms}
                required
                disabled={loading}
                onChange={() => setAcceptedTerms(true)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--emerald)]"
              />
              <span>
                I agree to the{" "}
                <Link
                  href="/legal/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--emerald)] underline-offset-2 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--emerald)] underline-offset-2 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </fieldset>
          {error ? <FormFlashError message={error} /> : null}
          <Button type="submit" disabled={loading || !math.solved || !acceptedTerms} className="w-full">
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
        description={`Enter the 6-digit code sent to ${email}.`}
        successTitle="Email verified successfully"
        successBody="Welcome to Alto Rich. Taking you to your dashboard…"
        onVerify={verifyOtp}
      />
    </AuthShell>
  );
}
