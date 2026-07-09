export function getDeviceFingerprint(userAgent: string, acceptLanguage?: string | null): string {
  const raw = `${userAgent}|${acceptLanguage ?? ""}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}
