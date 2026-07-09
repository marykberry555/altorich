"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OtpModal } from "@/components/auth/OtpModal";

export default function ForgotPinPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/recover/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Request failed.");
      return;
    }
    setMessage("If an account exists, a verification code has been sent.");
    setStep("reset");
    setOtpOpen(true);
  }

  async function resetPin(code: string) {
    const res = await fetch("/api/auth/recover/pin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Reset failed.");
    setOtpOpen(false);
    router.push(data.redirect ?? "/auth/login");
  }

  return (
    <AuthShell>
      <Card variant="elevated" padding="lg" className="w-full">
        <h1 className="text-xl font-bold text-[var(--heading)]">Forgot pin</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Recover access with your registered email address.</p>

        {step === "email" ? (
          <form onSubmit={requestOtp} className="mt-6 grid gap-3">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending…" : "Send verification code"}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setOtpOpen(true);
            }}
            className="mt-6 grid gap-3"
          >
            <Input
              label="New 6-digit pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
            {message ? <p className="text-xs text-[var(--emerald)]">{message}</p> : null}
            <Button type="submit" disabled={newPin.length !== 6} className="w-full">
              Verify & set new pin
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          <Link href="/auth/login" className="font-semibold text-[var(--emerald)]">
            Back to sign in
          </Link>
        </p>
      </Card>

      <OtpModal open={otpOpen} title="Verify pin reset" description={`Enter the code sent to ${email}.`} onVerify={resetPin} onClose={() => setOtpOpen(false)} />
    </AuthShell>
  );
}
