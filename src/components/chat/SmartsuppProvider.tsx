"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useTheme } from "@/components/theme/ThemeProvider";
import { SmartsuppBridge, SmartsuppWelcomeHint } from "@/components/chat/SmartsuppBridge";
import { buildSmartsuppBootstrap, getSmartsuppKey, smartsuppThemeColor } from "@/lib/chat/smartsupp";

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
  const key = getSmartsuppKey();

  useEffect(() => {
    if (!key && process.env.NODE_ENV === "development") {
       
      console.warn("[AltoRich] Smartsupp disabled — set NEXT_PUBLIC_SMARTSUPP_KEY in .env.local");
    }
  }, [key]);

  if (!key) return null;

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
