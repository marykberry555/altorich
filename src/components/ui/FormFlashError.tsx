"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function useFlashError(durationMs = 5000) {
  const [error, setError] = useState("");
  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(""), durationMs);
    return () => window.clearTimeout(timer);
  }, [error, durationMs]);
  return [error, setError] as const;
}

type Props = {
  message: string;
  className?: string;
};

export function FormFlashError({ message, className }: Props) {
  if (!message) return null;
  return <p className={cn("text-sm text-red-600", className)}>{message}</p>;
}
