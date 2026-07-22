"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PinField } from "@/components/ui/PinField";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { getClientDeviceFingerprint } from "@/lib/auth/device";
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

type AdminAuthMode = "email" | "pin";

export function AdminLoginForm({
  intent = "ops",
  successRedirect = "/hard",
  title = "Operations sign in",
  subtitle = "Admin and finance operators only.",
  submitLabel = "Sign in to ops centre",
  shell = "default"
}: Props) {
  const [mode, setMode] = useState<AdminAuthMode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailSubmit(event: React.FormEvent) {
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
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          intent
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (data.isAdmin === false) {
        setError("Administrator access required.");
        setLoading(false);
        return;
      }

      window.location.assign(data.redirect ?? successRedirect);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handlePinSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Admin sign-in is temporarily unavailable. Please try again shortly.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const deviceFingerprint = getClientDeviceFingerprint();
      if (!deviceFingerprint || deviceFingerprint === "fp_server" || deviceFingerprint.length < 3) {
        setError("Device verification is required. Refresh the page and try again.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          pin,
          deviceFingerprint,
          userAgent: navigator.userAgent,
          intent
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid username or PIN.");
        setLoading(false);
        return;
      }

      if (data.requiresDeviceOtp) {
        setError("Device verification is required. Check your admin email for a code.");
        setLoading(false);
        return;
      }

      window.location.assign(data.redirect ?? successRedirect);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const mutedClass = shell === "minimal" ? "text-zinc-400" : "text-[var(--text-muted)]";
  const headingClass = shell === "minimal" ? "text-white" : "text-[var(--heading)]";

  const form = (
    <Card
      variant="elevated"
      padding="lg"
      className={shell === "minimal" ? "w-full border-white/10 bg-zinc-900/90 text-white shadow-2xl" : "w-full"}
    >
      <div className="mb-6">
        <h1 className={`text-2xl font-bold tracking-tight ${headingClass}`}>{title}</h1>
        <p className={`mt-1 text-sm ${mutedClass}`}>{subtitle}</p>
      </div>

      <div className="mb-4 flex rounded-lg border border-white/10 p-0.5 text-xs">
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 font-semibold transition ${
            mode === "email" ? "bg-[var(--emerald)] text-white" : mutedClass
          }`}
          onClick={() => {
            setMode("email");
            setError("");
          }}
        >
          Email & password
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 font-semibold transition ${
            mode === "pin" ? "bg-[var(--emerald)] text-white" : mutedClass
          }`}
          onClick={() => {
            setMode("pin");
            setError("");
          }}
        >
          Username & PIN
        </button>
      </div>

      {mode === "email" ? (
        <form onSubmit={handleEmailSubmit} className="grid gap-3">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            minLength={8}
          />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <Button type="submit" disabled={loading || password.length < 8} className="w-full">
            {loading ? "Signing in..." : submitLabel}
          </Button>
        </form>
      ) : (
        <form onSubmit={handlePinSubmit} className="grid gap-3">
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
      )}

      <p className={`mt-4 text-center text-[10px] ${shell === "minimal" ? "text-zinc-500" : "text-[var(--text-subtle)]"}`}>
        {COMPANY.legalName} · Co. {COMPANY.companyNumber}
      </p>
    </Card>
  );

  if (shell === "minimal") return form;

  return <AuthShell>{form}</AuthShell>;
}
