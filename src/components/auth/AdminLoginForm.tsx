"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PinField } from "@/components/ui/PinField";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { useDeviceFingerprint } from "@/lib/auth/use-device-fingerprint";
import { isSupabaseConfigured } from "@/lib/env";
import { COMPANY } from "@/lib/company";

type Props = {
  intent?: "ops" | "admin-app";
  successRedirect?: string;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  /** Minimal dark card — used by /admin/auth native entry. */
  shell?: "default" | "minimal";
};

export function AdminLoginForm({
  intent = "ops",
  successRedirect = "/hard",
  title = "Operations sign in",
  subtitle = "Admin and finance operators only.",
  submitLabel = "Sign in to ops centre",
  shell = "default"
}: Props) {
  const deviceFingerprint = useDeviceFingerprint();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          username,
          pin,
          deviceFingerprint,
          userAgent: navigator.userAgent,
          intent
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        setLoading(false);
        return;
      }

      if (data.requiresDeviceOtp) {
        setError("Device verification is required. Check your admin email for a code, then try again from the homepage login.");
        setLoading(false);
        return;
      }

      window.location.assign(data.redirect ?? successRedirect);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const form = (
    <Card
      variant="elevated"
      padding="lg"
      className={shell === "minimal" ? "w-full border-white/10 bg-zinc-900/90 text-white shadow-2xl" : "w-full"}
    >
      <div className="mb-6">
        <h1 className={`text-2xl font-bold tracking-tight ${shell === "minimal" ? "text-white" : "text-[var(--heading)]"}`}>
          {title}
        </h1>
        <p className={`mt-1 text-sm ${shell === "minimal" ? "text-zinc-400" : "text-[var(--text-muted)]"}`}>{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
        />
        <PinField label="6-digit PIN" value={pin} onChange={setPin} required autoComplete="current-password" />
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <Button type="submit" disabled={loading || pin.length !== 6} className="w-full">
          {loading ? "Signing in..." : submitLabel}
        </Button>
      </form>

      <p className={`mt-4 text-center text-[10px] ${shell === "minimal" ? "text-zinc-500" : "text-[var(--text-subtle)]"}`}>
        {COMPANY.legalName} · Co. {COMPANY.companyNumber}
      </p>
    </Card>
  );

  if (shell === "minimal") return form;

  return <AuthShell>{form}</AuthShell>;
}
