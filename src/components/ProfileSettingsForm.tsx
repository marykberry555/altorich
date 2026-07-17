"use client";

import { useState } from "react";
import type { PackageSlug } from "@/content/packages";
import { PackageSelectionField } from "@/components/auth/PackageSelectionField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormFlashError, useFlashError } from "@/components/ui/FormFlashError";
import { capPhoneInput, DUPLICATE_IDENTITY_MESSAGE } from "@/lib/validation/identity";

export function ProfileSettingsForm({
  initialName,
  initialPhone,
  initialPreferredPackage,
  prefs
}: {
  initialName: string;
  initialPhone: string;
  initialPreferredPackage?: PackageSlug | "";
  prefs: { in_app: boolean; email: boolean; sms: boolean };
}) {
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [preferredPackage, setPreferredPackage] = useState<PackageSlug | "">(initialPreferredPackage ?? "");
  const [inApp, setInApp] = useState(prefs.in_app);
  const [email, setEmail] = useState(prefs.email);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useFlashError();

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!preferredPackage) {
      setMessage("Select your preferred investment sector.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        phone,
        preferredPackageSlug: preferredPackage,
        notificationPreferences: { in_app: inApp, email, sms: false }
      })
    });

    setLoading(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const msg =
        data.code === "IDENTITY_TAKEN" || /already exists|already registered|already taken/i.test(data.error ?? "")
          ? DUPLICATE_IDENTITY_MESSAGE
          : (data.error ?? "Could not save profile.");
      setError(msg);
      return;
    }
    setMessage("Profile saved.");
  }

  return (
    <form onSubmit={handleSave} className="grid gap-4">
      <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      <Input label="Phone" value={phone} onChange={(e) => setPhone(capPhoneInput(e.target.value))} required placeholder="08012345678" maxLength={11} inputMode="numeric" />
      <PackageSelectionField value={preferredPackage} onChange={setPreferredPackage} disabled={loading} />
      <div className="rounded-xl border border-[var(--border)] p-4">
        <p className="text-sm font-semibold text-[var(--heading)]">Notifications</p>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inApp} onChange={(e) => setInApp(e.target.checked)} />
          In-app notifications
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
          Email notifications
        </label>
      </div>
      {error ? <FormFlashError message={error} /> : null}
      {message ? (
        <p className={message.includes("saved") ? "text-xs text-[var(--emerald)]" : "text-xs text-red-600"}>{message}</p>
      ) : null}
      <Button type="submit" disabled={loading} size="sm">
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
