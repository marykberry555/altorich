"use client";

import { useMemo } from "react";
import { getDeviceFingerprint } from "@/lib/auth/device";

export function useDeviceFingerprint() {
  return useMemo(() => {
    if (typeof window === "undefined") return "fp_server";
    return getDeviceFingerprint(navigator.userAgent, navigator.language);
  }, []);
}
