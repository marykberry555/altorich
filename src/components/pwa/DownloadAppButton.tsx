"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { usePwaOptional } from "@/components/pwa/PwaProvider";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "primary" | "outline" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
  label?: string;
};

export function DownloadAppButton({
  variant = "outline",
  size = "sm",
  className,
  showIcon = true,
  label = "Download App"
}: Props) {
  const pwa = usePwaOptional();

  if (pwa?.canInstall) {
    return (
      <Button type="button" variant={variant} size={size} className={className} onClick={() => void pwa.promptInstall()}>
        {showIcon ? <Download size={size === "lg" ? 18 : 14} /> : null}
        Install App
      </Button>
    );
  }

  return (
    <Link href="/download" className={cn("inline-flex", className)}>
      <Button variant={variant} size={size} className="w-full">
        {showIcon ? <Download size={size === "lg" ? 18 : 14} /> : null}
        {label}
      </Button>
    </Link>
  );
}
