"use client";

import { useMemo } from "react";
import { getClientDeviceFingerprint } from "@/lib/auth/device";

export function useDeviceFingerprint() {
  return useMemo(() => getClientDeviceFingerprint(), []);
}
