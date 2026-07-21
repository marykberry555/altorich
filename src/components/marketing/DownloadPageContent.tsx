"use client";

import Image from "next/image";
import { DownloadImageButton } from "@/components/pwa/DownloadImageButton";
import { BRAND } from "@/lib/brand";

export function DownloadPageContent() {
  return (
    <section className="section-pad">
      <div className="container-ar mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-[var(--emerald-soft)] shadow-[var(--shadow-md)]">
          <Image src={BRAND.icon.light} alt="" width={64} height={64} className="h-14 w-14 object-contain" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl">Alto Rich App</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--text-muted)]">
          Install Alto Rich on your Android device for faster access and a full-screen experience.
        </p>

        <div className="mt-8 flex justify-center">
          <DownloadImageButton />
        </div>

        <div id="install-steps" className="mt-8 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-6 text-left">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--heading)]">How to install</h2>
          <ol className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--heading)]">1.</span> Tap the download banner above.
            </li>
            <li>
              <span className="font-semibold text-[var(--heading)]">2.</span> Open the downloaded file or install prompt.
            </li>
            <li>
              <span className="font-semibold text-[var(--heading)]">3.</span> Follow the installation steps.
            </li>
            <li>
              <span className="font-semibold text-[var(--heading)]">4.</span> Open Alto Rich — it starts on the login screen.
            </li>
            <li>
              <span className="font-semibold text-[var(--heading)]">5.</span> Sign in and continue investing.
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
