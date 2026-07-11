import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
 
const ROOT = process.cwd();
 
const paths = {
  brand: path.join(ROOT, "public", "brand"),
  icons: path.join(ROOT, "public", "icons"),
  og: path.join(ROOT, "public", "og"),
};
 
const sources = {
  logoLight: path.join(paths.brand, "logo-light.png"),
  logoDark: path.join(paths.brand, "logo-dark.png"),
  iconLight: path.join(paths.brand, "icon-light.png"),
  iconDark: path.join(paths.brand, "icon-dark.png"),
};
 
async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
 
async function assertSources() {
  const missing = [];
  for (const [k, p] of Object.entries(sources)) {
    if (!(await exists(p))) missing.push(`${k}: ${p}`);
  }
  if (missing.length) {
    throw new Error(
      [
        "[brand] Missing required brand assets:",
        ...missing.map((m) => `- ${m}`),
        "",
        "Expected files in public/brand/:",
        "- logo-light.png",
        "- logo-dark.png",
        "- icon-light.png",
        "- icon-dark.png",
      ].join("\n")
    );
  }
}
 
async function toWebp(inputPath, outputPath, { quality = 82 } = {}) {
  await sharp(inputPath).webp({ quality }).toFile(outputPath);
}
 
async function toPngIcon(inputPath, outputPath, size) {
  // Use a square crop for app icons/favicons.
  await sharp(inputPath)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
}
 
async function main() {
  await assertSources();
 
  // Brand WebP (used by theme-aware BrandLogo components)
  await toWebp(sources.logoLight, path.join(paths.brand, "logo-light.webp"), { quality: 82 });
  await toWebp(sources.logoDark, path.join(paths.brand, "logo-dark.webp"), { quality: 82 });
  await toWebp(sources.iconLight, path.join(paths.brand, "icon-light.webp"), { quality: 82 });
  await toWebp(sources.iconDark, path.join(paths.brand, "icon-dark.webp"), { quality: 82 });
 
  // Social preview fallback (keep existing name used in metadata)
  await toWebp(sources.logoLight, path.join(paths.og, "default.webp"), { quality: 82 });
  await sharp(sources.logoLight).png({ compressionLevel: 9 }).toFile(path.join(paths.og, "default.png"));
 
  // Theme-aware favicons (Next metadata can set media queries)
  await toPngIcon(sources.iconLight, path.join(paths.icons, "favicon-16x16-light.png"), 16);
  await toPngIcon(sources.iconDark, path.join(paths.icons, "favicon-16x16-dark.png"), 16);
  await toPngIcon(sources.iconLight, path.join(paths.icons, "favicon-32x32-light.png"), 32);
  await toPngIcon(sources.iconDark, path.join(paths.icons, "favicon-32x32-dark.png"), 32);
 
  // PWA icons (manifest cannot switch by theme; default to light assets)
  await toPngIcon(sources.iconLight, path.join(paths.icons, "android-chrome-192x192.png"), 192);
  await toPngIcon(sources.iconLight, path.join(paths.icons, "android-chrome-512x512.png"), 512);
  await toPngIcon(sources.iconLight, path.join(paths.icons, "apple-touch-icon.png"), 180);

  // Maskable icon — padded safe zone for adaptive Android launchers
  await sharp(sources.iconLight)
    .resize(512, 512, { fit: "contain", background: { r: 6, g: 78, b: 59, alpha: 1 } })
    .extend({ top: 64, bottom: 64, left: 64, right: 64, background: { r: 6, g: 78, b: 59, alpha: 1 } })
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(paths.icons, "android-chrome-512x512-maskable.png"));

  // Monochrome + notification icons
  await sharp(sources.iconDark)
    .resize(512, 512, { fit: "cover", position: "centre" })
    .grayscale()
    .png({ compressionLevel: 9 })
    .toFile(path.join(paths.icons, "icon-monochrome.png"));
  await toPngIcon(sources.iconLight, path.join(paths.icons, "notification-96x96.png"), 96);

  const pwaImagesDir = path.join(ROOT, "public", "images", "pwa");
  await fs.mkdir(pwaImagesDir, { recursive: true });
  await sharp(sources.logoLight)
    .resize(390, 844, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(pwaImagesDir, "screenshot-mobile.png"));
  await sharp(sources.logoLight)
    .resize(1280, 720, { fit: "contain", background: { r: 248, g: 247, b: 245, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(pwaImagesDir, "screenshot-desktop.png"));
 
  // Mask icon: generate from dark variant for contrast in pinned tabs
  await toPngIcon(sources.iconDark, path.join(paths.icons, "mask-icon.png"), 512);
 
  // Legacy favicon.ico remains as-is (can be regenerated later if desired).
  // If you want to regenerate it, prefer a dedicated ICO generator to preserve multi-size.
 
  // Browserconfig tile (Windows): reuse 192 square
  await toPngIcon(sources.iconLight, path.join(paths.icons, "mstile-150x150.png"), 150);
 
  console.log("[brand] Optimized brand assets written to public/brand, public/icons, public/og");
}
 
main().catch((err) => {
  console.error(err);
  process.exit(1);
});

