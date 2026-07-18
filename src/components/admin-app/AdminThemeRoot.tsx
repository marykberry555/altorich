"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { applyTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Ensures admin console visuals track ThemeProvider (toggle + persisted preference). */
export function AdminThemeRoot({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div
      className={cn("admin-app-root min-h-dvh", theme === "light" ? "admin-theme-light" : "admin-theme-dark")}
      data-admin-theme={theme}
    >
      {children}
    </div>
  );
}
