"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SecureConfirmDialog } from "@/components/trust/SecureConfirmDialog";
import { useDeviceFingerprint } from "@/lib/auth/use-device-fingerprint";

export type TrustedDeviceRow = {
  id: string;
  device_fingerprint: string;
  device_name: string;
  browser: string;
  operating_system: string;
  user_agent: string;
  ip_address: string | null;
  country: string | null;
  last_seen_at: string;
  created_at: string;
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function locationLabel(device: TrustedDeviceRow) {
  if (device.country) return device.country;
  return "Location unavailable";
}

type ConfirmMode = { type: "one"; id: string } | { type: "all" } | null;

export function TrustedDevicesManager({ initialDevices }: { initialDevices: TrustedDeviceRow[] }) {
  const router = useRouter();
  const currentFingerprint = useDeviceFingerprint();
  const [devices, setDevices] = useState(initialDevices);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);

  const pendingDevice = confirmMode?.type === "one" ? devices.find((d) => d.id === confirmMode.id) : null;

  async function remove(id: string) {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/auth/trusted-devices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not remove device.");
      setDevices((prev) => prev.filter((d) => d.id !== id));
      setMessage("Device removed. Sign-in from that browser will require email verification again.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not remove device.");
    } finally {
      setBusyId(null);
      setConfirmMode(null);
    }
  }

  async function removeAll() {
    setBusyAll(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/trusted-devices", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not remove devices.");
      setDevices([]);
      setMessage("All trusted devices removed.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not remove devices.");
    } finally {
      setBusyAll(false);
      setConfirmMode(null);
    }
  }

  function handleConfirm() {
    if (confirmMode?.type === "one") void remove(confirmMode.id);
    else if (confirmMode?.type === "all") void removeAll();
  }

  if (devices.length === 0) {
    return (
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        No trusted devices yet. After you verify a new browser once, it will appear here and skip OTP on future
        sign-ins.
      </p>
    );
  }

  return (
    <>
      <SecureConfirmDialog
        open={Boolean(confirmMode)}
        title={confirmMode?.type === "all" ? "Remove all trusted devices?" : "Remove trusted device?"}
        description={
          confirmMode?.type === "all"
            ? "Every browser will need email verification on next sign-in."
            : pendingDevice
              ? `Remove ${pendingDevice.device_name || pendingDevice.browser}? That browser will require verification again.`
              : undefined
        }
        confirmLabel="Remove"
        destructive
        onConfirm={handleConfirm}
        onCancel={() => setConfirmMode(null)}
      />
      <div className="mt-3 space-y-3">
        {message ? <p className="text-sm text-[var(--emerald)]">{message}</p> : null}
        <ul className="space-y-2 text-sm">
          {devices.map((device) => {
            const isCurrent = device.device_fingerprint === currentFingerprint;
            return (
              <li
                key={device.id}
                className="flex flex-col gap-3 rounded border border-[var(--border)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-[var(--heading)]">
                    {device.device_name || `${device.browser || "Browser"} device`}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {device.browser || "Unknown browser"}
                    {device.operating_system ? ` · ${device.operating_system}` : ""}
                    {" · "}
                    {locationLabel(device)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Last active {formatWhen(device.last_seen_at)}</p>
                  {isCurrent ? (
                    <div className="mt-2">
                      <Badge variant="emerald">Current device</Badge>
                    </div>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyId === device.id || busyAll}
                  onClick={() => setConfirmMode({ type: "one", id: device.id })}
                >
                  {busyId === device.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  <span className="ml-1.5">Remove</span>
                </Button>
              </li>
            );
          })}
        </ul>
        <Button type="button" variant="outline" size="sm" disabled={busyAll} onClick={() => setConfirmMode({ type: "all" })}>
          {busyAll ? <Loader2 className="animate-spin" size={14} /> : null}
          <span className={busyAll ? "ml-1.5" : ""}>Remove all devices</span>
        </Button>
      </div>
    </>
  );
}
