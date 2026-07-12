import fs from "node:fs";
import path from "node:path";

export type AdminReleaseMeta = {
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

const FALLBACK: AdminReleaseMeta = {
  packageId: "com.altorich.admin",
  name: "Alto Rich Admin",
  versionName: "1.0.0",
  versionCode: 1,
  buildNumber: 1,
  releaseDate: "pending",
  buildId: "pending",
  minSdkVersion: 21,
  minAndroid: "5.0 (API 21)",
  apkFile: "/downloads/altorich-admin-release.apk",
  aabFile: "/downloads/altorich-admin-release.aab",
  apkBytes: 0,
  aabBytes: 0,
  sha256CertFingerprint: "pending",
  updatedAt: new Date(0).toISOString()
};

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

/** Read release metadata written by `npm run android:admin:release`. */
export function getAdminReleaseMeta(): AdminReleaseMeta {
  try {
    const filePath = path.join(process.cwd(), "public/downloads/admin-release.json");
    if (!fs.existsSync(filePath)) return FALLBACK;
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<AdminReleaseMeta>;
    return { ...FALLBACK, ...raw };
  } catch {
    return FALLBACK;
  }
}
