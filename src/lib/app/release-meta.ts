import fs from "node:fs";
import path from "node:path";

export type AppReleaseMeta = {
  packageId: string;
  name: string;
  versionName: string;
  versionCode: number;
  buildNumber: number;
  releaseDate: string;
  buildId: string;
  minSdkVersion: number;
  minAndroid: string;
  apkFile: string;
  aabFile: string | null;
  apkBytes: number;
  aabBytes: number;
  sha256CertFingerprint: string;
  updatedAt: string;
};

const FALLBACK: AppReleaseMeta = {
  packageId: "com.altorich.app",
  name: "Alto Rich",
  versionName: "1.1.0",
  versionCode: 2,
  buildNumber: 2,
  releaseDate: "pending",
  buildId: "pending",
  minSdkVersion: 21,
  minAndroid: "5.0 (API 21)",
  apkFile: "/downloads/altorich-release.apk",
  aabFile: "/downloads/altorich-release.aab",
  apkBytes: 0,
  aabBytes: 0,
  sha256CertFingerprint: "pending",
  updatedAt: new Date(0).toISOString()
};

export function formatAppBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

/** Read release metadata written by `npm run android:release`. */
export function getAppReleaseMeta(): AppReleaseMeta {
  try {
    const filePath = path.join(process.cwd(), "public/downloads/app-release.json");
    if (!fs.existsSync(filePath)) return FALLBACK;
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<AppReleaseMeta>;
    return { ...FALLBACK, ...raw };
  } catch {
    return FALLBACK;
  }
}
