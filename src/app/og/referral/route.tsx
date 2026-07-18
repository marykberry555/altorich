import { ImageResponse } from "next/og";
import { COMPANY } from "@/lib/company";

export const runtime = "nodejs";
export const alt = "Join Alto Rich";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get("name") ?? "").trim().slice(0, 48);
  const code = (searchParams.get("code") ?? "").trim().toUpperCase().slice(0, 16);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0B1F17 0%, #0F3D2E 42%, #1A5C3A 72%, #C9A227 140%)",
          color: "#FFFFFF",
          fontFamily: "Georgia, 'Times New Roman', serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(212,175,55,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#F5D76E"
            }}
          >
            AR
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>Alto Rich</div>
            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.72)" }}>{COMPANY.legalName}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>
            Grow Your Wealth with Alto Rich
          </div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.88)", lineHeight: 1.35 }}>
            Start building your wealth with Alto Rich. Use my referral link to join our growing investment community.
          </div>
          {name || code ? (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 22,
                color: "#F5D76E"
              }}
            >
              {name ? `Invited by ${name}` : null}
              {name && code ? " · " : null}
              {code ? `Code ${code}` : null}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.7)" }}>altorich.com</div>
          <div
            style={{
              padding: "12px 22px",
              borderRadius: 999,
              background: "#D4AF37",
              color: "#0B1F17",
              fontSize: 22,
              fontWeight: 700
            }}
          >
            Join Alto Rich
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
