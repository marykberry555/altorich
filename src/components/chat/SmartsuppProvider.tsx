"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme/ThemeProvider";
import { SmartsuppBridge, SmartsuppWelcomeHint } from "@/components/chat/SmartsuppBridge";
import { buildSmartsuppBootstrap, getSmartsuppKey, smartsuppThemeColor } from "@/lib/chat/smartsupp";
import { isMarketingRoute } from "@/lib/route-zones";

function SmartsuppThemeSync() {
  const { theme } = useTheme();

  useEffect(() => {
    if (!getSmartsuppKey()) return;

    const color = smartsuppThemeColor(theme);
    if (window._smartsupp) window._smartsupp.color = color;

    document.documentElement.style.setProperty("--smartsupp-accent", color);
  }, [theme]);

  return null;
}

export function SmartsuppProvider() {
  const pathname = usePathname();
  const key = getSmartsuppKey();
  const enabled = Boolean(key) && isMarketingRoute(pathname);

  useEffect(() => {
    if (!key && process.env.NODE_ENV === "development") {
       
      console.warn("[AltoRich] Smartsupp disabled — set NEXT_PUBLIC_SMARTSUPP_KEY in .env.local");
    }
  }, [key]);

  useEffect(() => {
    if (!key) return;
    if (enabled) return;
    if (typeof window !== "undefined" && window.smartsupp) {
      window.smartsupp("chat:hide");
    }
  }, [enabled, key, pathname]);

  if (!enabled || !key) return null;

  const bootstrap = buildSmartsuppBootstrap(key);

  return (
    <>
      <Script id="smartsupp-bootstrap" strategy="afterInteractive">
        {bootstrap}
      </Script>
      <SmartsuppThemeSync />
      <SmartsuppBridge />
      <SmartsuppWelcomeHint />
    </>
  );
}
