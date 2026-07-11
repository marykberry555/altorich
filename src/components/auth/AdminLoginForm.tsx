"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { isSupabaseConfigured } from "@/lib/env";
import { COMPANY } from "@/lib/company";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/hard/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        setLoading(false);
        return;
      }
      window.location.assign(data.redirect ?? "/hard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <Card variant="elevated" padding="lg" className="w-full">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Operations access</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Admin sign in</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Restricted access for authorised {COMPANY.brand} operators only.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in to admin"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
          Member account?{" "}
          <Link href="/auth/login" className="font-semibold text-[var(--emerald)]">
            User sign in
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
