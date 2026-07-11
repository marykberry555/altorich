"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { useTheme } from "@/components/theme/ThemeProvider";

type Variant = "full" | "icon";

type Props = {
  variant?: Variant;
  className?: string;
  href?: string;
  priority?: boolean;
  showTagline?: boolean;
};

const sizes = {
  full: { width: 148, height: 40, iconOnly: false },
  icon: { width: 36, height: 36, iconOnly: true }
} as const;

export function BrandLogo({ variant = "full", className, href = "/", priority, showTagline }: Props) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? theme : "light";
  const isDark = activeTheme === "dark";
  const spec = sizes[variant];
  const src = spec.iconOnly
    ? isDark
      ? BRAND.icon.dark
      : BRAND.icon.light
    : isDark
      ? BRAND.logo.dark
      : BRAND.logo.light;
  const fallback = spec.iconOnly
    ? isDark
      ? BRAND.icon.darkPng
      : BRAND.icon.lightPng
    : isDark
      ? BRAND.logo.darkPng
      : BRAND.logo.lightPng;

  const img = (
    <Image
      src={src}
      alt="AltoRich"
      width={spec.width}
      height={spec.height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", variant === "full" ? "max-h-9" : "max-h-9 max-w-9")}
      onError={(e) => {
        const target = e.currentTarget;
        if (!target.src.endsWith(".png")) target.src = fallback;
      }}
    />
  );

  const content = (
    <span className={cn("brand-plate inline-flex items-center gap-2.5", className)}>
      {img}
      {showTagline ? (
        <span className="hidden text-[10px] font-medium text-[var(--text-subtle)] sm:block">Nigeria · NGN</span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
