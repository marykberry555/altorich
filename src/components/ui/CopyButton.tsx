"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props = {
  value: string;
  label?: string;
  size?: "sm" | "md";
};

export function CopyButton({ value, label = "Copy", size = "sm" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size={size} onClick={copy} disabled={!value} className="gap-1.5">
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      {copied ? "Copied" : label}
    </Button>
  );
}
