"use client";

import { useEffect } from "react";
import {
  chunkRecoveryAlreadyTried,
  isChunkLoadFailure,
  recoverFromChunkFailure,
  safeRecoveryHref
} from "@/lib/cache/chunk-recovery";

/**
 * Root layout replacement for catastrophic failures.
 * Must include its own html/body. Avoid app providers (Theme, etc.) —
 * they are unavailable when this surface mounts.
 */
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isChunkLoadFailure(error.message)) {
      if (!chunkRecoveryAlreadyTried()) {
        void recoverFromChunkFailure(error.message);
        return;
      }
      window.location.replace(safeRecoveryHref(window.location.pathname || "/"));
    }
  }, [error]);

  const refreshing = isChunkLoadFailure(error.message);

  return (
    <html lang="en-NG">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          background: "linear-gradient(165deg, #f8f7f5 0%, #eef2f0 55%, #e8efe9 100%)",
          color: "#0f172a"
        }}
      >
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 16px",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#064e3b"
            }}
          >
            Alto Rich
          </p>
          <h1 style={{ fontSize: 22, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            {refreshing ? "Refreshing your experience" : "We're preparing this page"}
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#64748b", margin: "0 0 20px" }}>
            {refreshing
              ? "We're preparing the latest version of Alto Rich. This only takes a moment."
              : "We're temporarily unable to load this information. Refresh the page, or return home."}
          </p>
          {!refreshing ? (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => window.location.assign("/")}
                style={{
                  border: 0,
                  borderRadius: 10,
                  padding: "10px 16px",
                  background: "#064e3b",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Go home
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    reset();
                  } catch {
                    window.location.reload();
                  }
                }}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "10px 16px",
                  background: "#fff",
                  color: "#0f172a",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Refresh page
              </button>
            </div>
          ) : (
            <div
              style={{
                height: 4,
                width: 160,
                margin: "0 auto",
                borderRadius: 999,
                background: "#e2e8f0",
                overflow: "hidden"
              }}
              aria-hidden
            >
              <div
                style={{
                  height: "100%",
                  width: "50%",
                  borderRadius: 999,
                  background: "#064e3b"
                }}
              />
            </div>
          )}
        </main>
      </body>
    </html>
  );
}
