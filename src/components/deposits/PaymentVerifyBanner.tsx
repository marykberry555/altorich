"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function PaymentVerifyBanner() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("verify");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "failed">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;
    const ref = reference;
    async function verify() {
      setStatus("loading");
      const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(ref)}`);
      const body = await response.json();
      if (cancelled) return;

      if (response.ok && (body.success || body.alreadyProcessed)) {
        setStatus("success");
        setMessage("Payment verified. Your wallet has been credited.");
        return;
      }

      setStatus("failed");
      setMessage(body.error ?? "Payment could not be verified. Contact support if you were charged.");
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (!reference || status === "idle") return null;

  return (
    <Card
      variant="elevated"
      className={`mb-6 !p-4 ${status === "success" ? "border-emerald-300" : status === "failed" ? "border-amber-300" : ""}`}
    >
      {status === "loading" ? (
        <p className="flex items-center gap-2 text-sm">
          <Loader2 className="animate-spin" size={16} /> Verifying payment…
        </p>
      ) : (
        <p className="text-sm">{message}</p>
      )}
    </Card>
  );
}
