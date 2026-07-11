"use client";

import { useState } from "react";
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
      setError("Admin sign-in is temporarily unavailable. Please try again shortly.");
      return;
    }

    setLoading(true);
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
          <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)]">Operations sign in</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Admin and finance operators only.</p>
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
            {loading ? "Signing in..." : "Sign in to ops centre"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[10px] text-[var(--text-subtle)]">
          {COMPANY.legalName} · Co. {COMPANY.companyNumber}
        </p>
      </Card>
    </AuthShell>
  );
}
