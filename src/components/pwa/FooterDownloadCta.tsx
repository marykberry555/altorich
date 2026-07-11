"use client";

import { DownloadAppBadge } from "@/components/pwa/DownloadAppBadge";

export function FooterDownloadCta() {
  return (
    <div className="mt-6">
      <DownloadAppBadge size="md" tone="surface" />
    </div>
  );
}
