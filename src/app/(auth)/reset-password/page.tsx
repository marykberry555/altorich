"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { isSupabaseConfigured } from "@/lib/env";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    setMessage("Password updated. Redirecting to sign in…");
    setTimeout(() => router.push("/auth/login"), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gray-50)] p-4">
      <Card variant="elevated" padding="lg" className="w-full max-w-md">
        <h1 className="text-xl font-bold text-[var(--heading)]">Choose a new password</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Enter a strong password for your account.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
          <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <Input label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          {message ? <p className="text-xs text-[var(--emerald)]">{message}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          <Link href="/auth/login" className="font-semibold text-[var(--emerald)]">
            Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
