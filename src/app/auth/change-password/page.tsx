"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ChangePasswordForm() {
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") === "1";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: password })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not update password.");
      return;
    }
    window.location.assign(data.redirect ?? (isAdmin ? "/admin" : "/dashboard"));
  }

  return (
    <AuthShell>
      <Card variant="elevated" padding="lg" className="w-full">
        <h1 className="text-xl font-bold text-[var(--heading)]">Set a new password</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Your administrator account requires a password update before continuing.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
          <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <Input label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving…" : "Save password"}
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-muted)]">AltoRich... Hold On</div>}>
      <ChangePasswordForm />
    </Suspense>
  );
}
