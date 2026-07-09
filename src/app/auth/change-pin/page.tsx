"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ChangePinPage() {
  const router = useRouter();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [forced, setForced] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/change-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPin: forced ? undefined : currentPin,
        newPin,
        forced
      })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not update pin.");
      return;
    }
    router.push(data.redirect ?? "/dashboard");
    router.refresh();
  }

  return (
    <AuthShell>
      <Card variant="elevated" padding="lg" className="w-full">
        <h1 className="text-xl font-bold text-[var(--heading)]">Set your pin</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">For your security, choose a new 6-digit pin before continuing.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
          {!forced ? (
            <Input
              label="Current pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          ) : null}
          <Input
            label="New 6-digit pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <input type="checkbox" checked={!forced} onChange={(e) => setForced(!e.target.checked)} />
            I already have a pin and want to change it
          </label>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading || newPin.length !== 6} className="w-full">
            {loading ? "Saving…" : "Save pin"}
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}
