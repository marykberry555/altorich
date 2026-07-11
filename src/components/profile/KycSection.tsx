"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/design-system";

type KycStatus = "pending" | "approved" | "rejected" | "requires_update";

type Props = {
  status: KycStatus;
  rejectionReason?: string | null;
};

const DOC_TYPES = [
  { key: "government_id", label: "Government ID" },
  { key: "selfie", label: "Selfie / photo" }
] as const;

export function KycSection({ status, rejectionReason }: Props) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function upload(documentType: string, file: File) {
    setUploading(documentType);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const response = await fetch("/api/uploads/kyc-document", { method: "POST", body: formData });
    setUploading(null);

    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error ?? "Upload failed.");
      return;
    }

    setMessage("Document submitted. Our team will review it shortly.");
  }

  return (
    <Card variant="elevated" className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--heading)]">Identity verification (KYC)</h2>
        <StatusBadge status={status} />
      </div>

      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Complete KYC to unlock payouts. BVN/NIN verification will be wired when provider credentials are available.
      </p>

      {rejectionReason ? (
        <p className="mt-2 rounded-[var(--radius-sm)] bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
          {rejectionReason}
        </p>
      ) : null}

      {status !== "approved" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DOC_TYPES.map((doc) => (
            <label
              key={doc.key}
              className="flex cursor-pointer flex-col gap-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] p-4 text-sm hover:border-[var(--emerald)]"
            >
              <span className="font-medium">{doc.label}</span>
              <span className="flex items-center gap-2 text-[var(--text-muted)]">
                {uploading === doc.key ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                JPEG, PNG, WebP, or PDF (max 5MB)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                disabled={!!uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(doc.key, file);
                }}
              />
            </label>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--emerald)]">Your identity is verified. Withdrawals are enabled.</p>
      )}

      {message ? <p className="mt-3 text-sm text-[var(--text-muted)]">{message}</p> : null}
    </Card>
  );
}
