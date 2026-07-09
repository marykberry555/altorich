"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  onVerify: (code: string) => Promise<void>;
  onClose?: () => void;
};

export function OtpModal({ open, title = "Enter verification code", description, onVerify, onClose }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCode("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onVerify(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <Card variant="elevated" padding="lg" className="w-full max-w-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--heading)]">{title}</h2>
            {description ? <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p> : null}
          </div>
          {onClose ? (
            <button type="button" onClick={onClose} className="text-sm text-[var(--text-muted)] hover:text-[var(--heading)]">
              Close
            </button>
          ) : null}
        </div>

        <form onSubmit={submit} className="mt-5 grid gap-3">
          <Input
            ref={inputRef}
            label="6-digit code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            className="tracking-[0.35em] text-center text-lg font-semibold"
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
