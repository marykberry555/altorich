import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ADMIN_AUTH } from "@/lib/admin-app/constants";
import { formatBytes, getAdminReleaseMeta } from "@/lib/admin-app/release-meta";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Download Alto Rich Admin",
  description: "Install the Alto Rich Admin Android application (APK).",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark"
};

export default function AdminDownloadPage() {
  const release = getAdminReleaseMeta();
  const apkReady = release.apkBytes > 0;

  return (
    <div className="admin-app-root flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
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
            Admin only · RC1
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{release.name}</h1>
          <p className="mt-2 text-sm text-zinc-400">Native Android operations console · package {release.packageId}</p>
        </div>

        <dl className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-5 text-sm">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Latest version</dt>
            <dd className="mt-1 font-semibold text-white">{release.versionName}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Build number</dt>
            <dd className="mt-1 font-semibold text-white">{release.buildNumber}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Release date</dt>
            <dd className="mt-1 font-semibold text-white">{release.releaseDate}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">App size</dt>
            <dd className="mt-1 font-semibold text-white">{formatBytes(release.apkBytes)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Minimum Android</dt>
            <dd className="mt-1 font-semibold text-white">{release.minAndroid}</dd>
          </div>
        </dl>

        {apkReady ? (
          <a href={release.apkFile} download className="block">
            <Button type="button" size="lg" className="w-full gap-2">
              <Download size={18} />
              Download APK
            </Button>
          </a>
        ) : (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Release APK is not published yet. Run <code className="text-amber-50">npm run android:admin:release</code> on
            a build machine with JDK 17+, then redeploy.
          </div>
        )}

        <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-zinc-900/80 p-5 text-sm text-zinc-300">
          <h2 className="text-sm font-semibold text-white">Installation guide</h2>
          <ol className="list-decimal space-y-2 pl-5 text-zinc-400">
            <li>On your Android phone, open this page and tap Download APK.</li>
            <li>If prompted, allow installs from this browser / source.</li>
            <li>Open the downloaded file and tap Install.</li>
            <li>
              Launch <strong className="text-zinc-200">Alto Rich Admin</strong> from your app drawer (dark icon — not
              Chrome).
            </li>
            <li>
              Sign in at <Link href={ADMIN_AUTH} className="text-emerald-400 hover:underline">/admin/auth</Link> with
              your administrator credentials.
            </li>
          </ol>
          <p className="text-xs text-zinc-500">
            This build is a Trusted Web Activity. It launches as a standalone app with its own icon, splash, and task
            card — not as a browser tab.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Also available:{" "}
          <Link href="/admin-app/install" className="text-emerald-400 hover:underline">
            PWA install
          </Link>
        </p>
      </div>
    </div>
  );
}
