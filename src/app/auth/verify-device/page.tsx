import { Suspense } from "react";
import { VerifyDeviceClient } from "@/components/auth/VerifyDeviceClient";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card } from "@/components/ui/Card";

export default function VerifyDevicePage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <Card variant="elevated" padding="lg" className="w-full">
            <p className="text-sm text-[var(--text-muted)]">Preparing device verification…</p>
          </Card>
        </AuthShell>
      }
    >
      <VerifyDeviceClient />
    </Suspense>
  );
}
