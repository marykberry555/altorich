"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotUsernamePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/recover/username", {
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
    setMessage("If an account exists for this email, your username has been sent to your inbox.");
  }

  return (
    <AuthShell>
      <Card variant="elevated" padding="lg" className="w-full">
        <h1 className="text-xl font-bold text-[var(--heading)]">Forgot username</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">We will email your username if a matching account is found.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          {message ? <p className="text-xs text-[var(--emerald)]">{message}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Send username reminder"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          <Link href="/auth/login" className="font-semibold text-[var(--emerald)]">
            Back to sign in
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
