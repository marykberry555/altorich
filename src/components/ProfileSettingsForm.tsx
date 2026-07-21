"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import type { PackageSlug } from "@/content/packages";
import { PackageSelectionField } from "@/components/auth/PackageSelectionField";
import { LocationFields } from "@/components/location/LocationFields";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormFlashError, useFlashError } from "@/components/ui/FormFlashError";
import { SecureConfirmDialog } from "@/components/trust/SecureConfirmDialog";
import { COMPANY } from "@/lib/company";
import { capPhoneInput, DUPLICATE_IDENTITY_MESSAGE } from "@/lib/validation/identity";
import type { NgStateCode } from "@/lib/location/ng-locations";
import { isNgStateCode } from "@/lib/location/ng-locations";

export function ProfileSettingsForm({
  initialName,
  initialPhone,
  initialPreferredPackage,
  initialStateCode,
  initialCityArea,
  prefs
}: {
  initialName: string;
  initialPhone: string;
  initialPreferredPackage?: PackageSlug | "";
  initialStateCode?: string | null;
  initialCityArea?: string | null;
  prefs: { in_app: boolean; email: boolean; sms: boolean };
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [preferredPackage, setPreferredPackage] = useState<PackageSlug | "">(initialPreferredPackage ?? "");
  const [locationStateCode, setLocationStateCode] = useState<NgStateCode | "">(
    initialStateCode && isNgStateCode(initialStateCode) ? initialStateCode : ""
  );
  const [locationCityArea, setLocationCityArea] = useState(initialCityArea ?? "");
  const [inApp, setInApp] = useState(prefs.in_app);
  const [email, setEmail] = useState(prefs.email);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useFlashError();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!preferredPackage) {
      setMessage("Select your preferred investment portfolio.");
      return;
    }
    if (!locationStateCode || !locationCityArea) {
      setMessage("Select your state and city / area.");
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmSave() {
    setConfirmOpen(false);
    setLoading(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        preferredPackageSlug: preferredPackage,
        locationStateCode,
        locationCityArea,
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
    <>
      <SecureConfirmDialog
        open={confirmOpen}
        title="Save profile changes?"
        description="Your phone, location, preferred portfolio, and notification preferences will be updated."
        confirmLabel="Save changes"
        onConfirm={() => void confirmSave()}
        onCancel={() => setConfirmOpen(false)}
      />
    <form onSubmit={handleSave} className="grid gap-4">
      <div className="grid gap-1.5">
        <span className="text-sm font-medium text-[var(--text-muted)]">Registered Full Name</span>
        <div
          className="flex h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--heading)]"
          aria-readonly="true"
        >
          <Lock size={14} className="shrink-0 text-[var(--text-subtle)]" aria-hidden />
          <span className="truncate font-medium">{initialName || "—"}</span>
        </div>
        <p className="text-xs leading-relaxed text-[var(--text-subtle)]">
          For your security, your registered name cannot be changed from your account.
          <br />
          If your legal name has changed or your details are incorrect, please contact Alto Rich Support at{" "}
          <a className="underline underline-offset-2" href={`mailto:${COMPANY.supportEmail}`}>
            {COMPANY.supportEmail}
          </a>
          . Identity verification is required before any name update can be approved.
        </p>
      </div>
      <Input
        label="Phone"
        value={phone}
        onChange={(e) => setPhone(capPhoneInput(e.target.value))}
        required
        placeholder="08012345678"
        maxLength={11}
        inputMode="numeric"
      />
      <LocationFields
        stateCode={locationStateCode}
        cityArea={locationCityArea}
        onStateChange={setLocationStateCode}
        onCityChange={setLocationCityArea}
        disabled={loading}
      />
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
    </>
  );
}
