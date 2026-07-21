"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { usePwaOptional } from "@/components/pwa/PwaProvider";
import { cn } from "@/lib/utils";
import { PWA } from "@/lib/pwa/config";

type Props = {
  className?: string;
};

type Phase =
  | "idle"
  | "prompting"
  | "installing"
  | "opening"
  | "ready"
  | "apk-downloading"
  | "apk-ready"
  | "cancelled"
  | "error";

const APK_URL = "/downloads/altorich-release.apk";

function phaseCopy(phase: Phase, progress: number | null): { title: string; detail: string } {
  switch (phase) {
    case "prompting":
      return {
        title: "Confirm install",
        detail: "Use the system install sheet — tap Install to continue."
      };
    case "installing":
      return {
        title: "Installing Alto Rich…",
        detail: "Almost done. Keep this screen open."
      };
    case "opening":
      return {
        title: "Opening Alto Rich…",
        detail: "Taking you to the login screen."
      };
    case "ready":
      return {
        title: "Installed",
        detail: "Tap Open to continue to login."
      };
    case "apk-downloading":
      return {
        title: progress != null ? `Downloading… ${progress}%` : "Downloading Alto Rich…",
        detail: "Your Android package is downloading. We’ll open the installer next."
      };
    case "apk-ready":
      return {
        title: "Download ready",
        detail: "Open the downloaded file, tap Install, then open Alto Rich."
      };
    case "cancelled":
      return {
        title: "Install cancelled",
        detail: "Tap the banner again when you’re ready, or follow the steps below."
      };
    case "error":
      return {
        title: "Something went wrong",
        detail: "Try again, or use the install steps below."
      };
    default:
      return { title: "", detail: "" };
  }
}

export function DownloadImageButton({ className }: Props) {
  const pwa = usePwaOptional();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
    };
  }, []);

  useEffect(() => {
    const onInstalled = () => {
      setPhase("opening");
      openTimer.current = setTimeout(() => {
        window.location.assign(PWA.startUrl);
      }, 900);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  const downloadApkWithProgress = useCallback(async () => {
    setPhase("apk-downloading");
    setProgress(0);
    try {
      const response = await fetch(APK_URL, { cache: "no-store" });
      if (!response.ok) throw new Error("Download failed");

      const total = Number(response.headers.get("content-length") ?? "0");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (total > 0) setProgress(Math.min(99, Math.round((received / total) * 100)));
        }
      }

      const blob = new Blob(chunks as BlobPart[], {
        type: "application/vnd.android.package-archive"
      });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "altorich-release.apk";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setProgress(100);
      setPhase("apk-ready");
    } catch {
      setPhase("error");
      setProgress(null);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (pwa?.isStandalone) {
      window.location.href = PWA.startUrl;
      return;
    }

    if (pwa?.canInstall) {
      setPhase("prompting");
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      try {
        const accepted = await pwa.promptInstall();
        if (accepted) {
          setPhase("installing");
          // appinstalled listener opens login; fallback if event is delayed/missing
          openTimer.current = setTimeout(() => {
            setPhase((current) => {
              if (current === "installing") {
                window.location.assign(PWA.startUrl);
                return "opening";
              }
              return current;
            });
          }, 4500);
          return;
        }
        setPhase("cancelled");
        return;
      } catch {
        setPhase("error");
        return;
      }
    }

    // Android / browsers without install prompt → APK with visible progress
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      await downloadApkWithProgress();
      return;
    }

    document.getElementById("install-steps")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [pwa, downloadApkWithProgress]);

  if (pwa?.isStandalone) {
    return (
      <Link
        href={PWA.startUrl}
        className={cn("inline-block w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)]", className)}
        aria-label="Open Alto Rich app"
      >
        <Image
          src="/images/download.webp"
          alt="Open Alto Rich"
          width={936}
          height={263}
          priority
          unoptimized
          className="h-auto w-full transition duration-300 hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
        />
      </Link>
    );
  }

  const status = phase !== "idle" ? phaseCopy(phase, progress) : null;
  const busy = phase === "prompting" || phase === "installing" || phase === "opening" || phase === "apk-downloading";

  return (
    <div className={cn("w-full max-w-lg", className)}>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={busy}
        className={cn(
          "relative block w-full overflow-hidden rounded-[var(--radius-lg)] transition duration-300",
          "hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--emerald-mid)]",
          "disabled:pointer-events-none disabled:opacity-90"
        )}
        aria-label="Download Alto Rich app"
        aria-busy={busy || undefined}
      >
        <Image
          src="/images/download.webp"
          alt="Download Alto Rich — Invest Smarter. Earn More."
          width={936}
          height={263}
          priority
          unoptimized
          className="h-auto w-full select-none rounded-[var(--radius-lg)]"
        />
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[var(--navy)]/55 backdrop-blur-[2px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--heading)] shadow-[var(--shadow-md)]">
              <Loader2 size={16} className="animate-spin text-[var(--emerald)]" aria-hidden />
              {phase === "apk-downloading" && progress != null ? `${progress}%` : "Working…"}
            </span>
          </span>
        ) : null}
      </button>

      {status ? (
        <div
          className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-left shadow-[var(--shadow-sm)]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {phase === "ready" || phase === "apk-ready" ? (
              <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-[var(--emerald)]" aria-hidden />
            ) : busy ? (
              <Loader2 size={22} className="mt-0.5 shrink-0 animate-spin text-[var(--emerald)]" aria-hidden />
            ) : (
              <Smartphone size={22} className="mt-0.5 shrink-0 text-[var(--emerald)]" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--heading)]">{status.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{status.detail}</p>
              {phase === "apk-downloading" && progress != null ? (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--gray-200)]">
                  <div
                    className="h-full rounded-full bg-[var(--emerald)] transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
              {(phase === "ready" || phase === "opening" || phase === "installing") && (
                <Link
                  href={PWA.startUrl}
                  className="mt-3 inline-flex rounded-[var(--radius-sm)] bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open Alto Rich
                </Link>
              )}
              {phase === "apk-ready" ? (
                <a
                  href={APK_URL}
                  className="mt-3 inline-flex rounded-[var(--radius-sm)] bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Download again
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
