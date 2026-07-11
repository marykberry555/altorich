import fs from "fs";
import path from "path";

let cachedBuildId: string | null = null;

/** Runtime BUILD_ID from the active `.next` output (changes every deployment). */
export function getBuildId(): string {
  if (cachedBuildId) return cachedBuildId;

  try {
    cachedBuildId = fs.readFileSync(path.join(process.cwd(), ".next/BUILD_ID"), "utf8").trim();
  } catch {
    cachedBuildId = process.env.NEXT_BUILD_ID ?? "development";
  }

  return cachedBuildId;
}
