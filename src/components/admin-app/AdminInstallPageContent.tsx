"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminPwa } from "@/components/admin-app/AdminAppPwaProvider";
import { ADMIN_APP_INSTALL, ADMIN_AUTH } from "@/lib/admin-app/constants";

export function AdminInstallPageContent() {
  const { canInstall, promptInstall, isStandalone, pushReady, subscribePush } = useAdminPwa();

  return (
    <div className="admin-app-root flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
          <Image
            src="/admin-app/icon-192.png"
            alt=""
            width={96}
            height={96}
            className="h-full w-full object-cover"
            priority
          />
        </div>

        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
          <Shield size={12} aria-hidden />
          Admin only
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Alto Rich Admin</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Install the operations console on your device. No sign-in required to install — sign in after opening the app.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          {canInstall ? (
            <Button type="button" size="lg" className="w-full gap-2" onClick={() => void promptInstall()}>
              <Download size={18} />
              Install Admin App
            </Button>
          ) : isStandalone ? (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Admin app is installed on this device.
            </p>
          ) : (
            <div className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-4 text-left text-sm text-zinc-300">
              <p className="font-medium text-white">Install from your browser</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
                <li>
                  <strong className="text-zinc-200">Chrome / Edge:</strong> menu → Install app
                </li>
                <li>
                  <strong className="text-zinc-200">Android (native APK):</strong>{" "}
                  <a href="/admin/download" className="text-emerald-400 hover:underline">
                    Download page
                  </a>
                </li>
                <li>
                  <strong className="text-zinc-200">Android (browser):</strong> Add to Home screen
                </li>
                <li>
                  <strong className="text-zinc-200">iPhone:</strong> Share → Add to Home Screen
                </li>
              </ul>
            </div>
          )}

          {pushReady ? (
            <Button type="button" variant="outline" size="sm" className="border-white/10 bg-white/5 text-zinc-100" onClick={() => void subscribePush()}>
              Enable push alerts
            </Button>
          ) : null}

          <Link href={ADMIN_AUTH} className="text-sm text-emerald-400 hover:underline">
            Already installed? Sign in
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/80 p-5 text-left">
          <h2 className="text-sm font-semibold text-white">Install link</h2>
          <p className="mt-2 break-all text-xs text-zinc-400">https://altorich.com{ADMIN_APP_INSTALL}</p>
          <p className="mt-3 text-xs text-zinc-500">
            This dark-icon app is separate from the member Alto Rich app. Administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}
