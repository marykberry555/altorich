"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ProfileSettingsForm({
  initialName,
  initialPhone,
  prefs
}: {
  initialName: string;
  initialPhone: string;
  prefs: { in_app: boolean; email: boolean; sms: boolean };
}) {
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [inApp, setInApp] = useState(prefs.in_app);
  const [email, setEmail] = useState(prefs.email);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        phone,
        notificationPreferences: { in_app: inApp, email, sms: false }
      })
    });

    setLoading(false);
    setMessage(response.ok ? "Profile saved." : "Could not save profile.");
  }

  return (
    <form onSubmit={handleSave} className="grid gap-3">
      <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={inApp} onChange={(e) => setInApp(e.target.checked)} />
        In-app notifications
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
        Email notifications
      </label>
      {message ? <p className="text-xs text-[var(--emerald)]">{message}</p> : null}
      <Button type="submit" disabled={loading} size="sm">
        {loading ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
