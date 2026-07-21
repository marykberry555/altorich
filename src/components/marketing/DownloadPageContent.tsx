import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DownloadImageButton } from "@/components/pwa/DownloadImageButton";
import { BRAND } from "@/lib/brand";
import { formatAppBytes, getAppReleaseMeta } from "@/lib/app/release-meta";

export function DownloadPageContent() {
  const release = getAppReleaseMeta();
  const apkReady = release.apkBytes > 0;

  return (
    <section className="section-pad">
      <div className="container-ar mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-[var(--emerald-soft)] shadow-[var(--shadow-md)]">
          <Image src={BRAND.icon.light} alt="" width={64} height={64} className="h-14 w-14 object-contain" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl">Alto Rich App</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--text-muted)]">
          Install Alto Rich on your Android device for faster access to portfolios, deposits, and weekly payouts.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-left text-sm">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Version</dt>
            <dd className="mt-1 font-semibold text-[var(--heading)]">{release.versionName}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Build</dt>
            <dd className="mt-1 font-semibold text-[var(--heading)]">{release.buildNumber}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Released</dt>
            <dd className="mt-1 font-semibold text-[var(--heading)]">{release.releaseDate}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Size</dt>
            <dd className="mt-1 font-semibold text-[var(--heading)]">{formatAppBytes(release.apkBytes)}</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-3">
          {apkReady ? (
            <a href={release.apkFile} download className="block">
              <Button type="button" size="lg" className="w-full gap-2">
                <Download size={18} aria-hidden />
                Download Android APK
              </Button>
            </a>
          ) : (
            <p className="rounded-[var(--radius)] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
              APK is being prepared. You can still install from Chrome below.
            </p>
          )}
          <div className="flex justify-center">
            <DownloadImageButton />
          </div>
        </div>

        <div id="install-steps" className="mt-8 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-6 text-left">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--heading)]">How to install</h2>
          <ol className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--heading)]">1.</span> Tap <strong>Download Android APK</strong>.
            </li>
            <li>
              <span className="font-semibold text-[var(--heading)]">2.</span> Allow installs from this browser if Android asks.
            </li>
            <li>
              <span className="font-semibold text-[var(--heading)]">3.</span> Open the downloaded file and tap Install.
            </li>
            <li>
              <span className="font-semibold text-[var(--heading)]">4.</span> Open <strong>Alto Rich</strong> from your app drawer.
            </li>
            <li>
              <span className="font-semibold text-[var(--heading)]">5.</span>{" "}
              <Link href="/auth/login" className="font-semibold text-[var(--emerald-mid)] underline-offset-2 hover:underline">
                Log in
              </Link>{" "}
              and continue with deposits, portfolios, and weekly payouts.
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
