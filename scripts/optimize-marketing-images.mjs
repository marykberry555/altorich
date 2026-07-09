import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const IMAGES = path.join(ROOT, "public", "images");

/** Uniform package card size (5:4) — matches detail page 800×520 ratio */
const PACKAGE_WIDTH = 1200;
const PACKAGE_HEIGHT = 960;
const PACKAGE_QUALITY = 82;

/** Hero — wider 3:2 */
const HERO_WIDTH = 1536;
const HERO_HEIGHT = 1024;
const HERO_QUALITY = 84;

const packages = [
  { input: "Starter.png", output: "starter.webp", altKey: "starter" },
  { input: "Growth.png", output: "growth.webp", altKey: "growth" },
  { input: "Premium.png", output: "premium.webp", altKey: "premium" },
  { input: "Elite.png", output: "elite.webp", altKey: "elite" }
];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function optimizePackage(inputPath, outputPath) {
  const TARGET_BYTES = 125 * 1024;

  await sharp(inputPath)
    .resize(PACKAGE_WIDTH, PACKAGE_HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: PACKAGE_QUALITY, effort: 6 })
    .toFile(outputPath);

  let stat = await fs.stat(outputPath);
  if (stat.size > TARGET_BYTES * 1.15) {
    for (const quality of [76, 72, 68]) {
      await sharp(inputPath)
        .resize(PACKAGE_WIDTH, PACKAGE_HEIGHT, { fit: "cover", position: "centre" })
        .webp({ quality, effort: 6 })
        .toFile(outputPath);
      stat = await fs.stat(outputPath);
      if (stat.size <= TARGET_BYTES * 1.15) break;
    }
  }

  return stat.size;
}

async function optimizeHero(inputPath, outputPath) {
  await sharp(inputPath)
    .resize(HERO_WIDTH, HERO_HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: HERO_QUALITY, effort: 6 })
    .toFile(outputPath);

  const stat = await fs.stat(outputPath);
  return stat.size;
}

async function main() {
  const results = [];

  for (const pkg of packages) {
    const input = path.join(IMAGES, pkg.input);
    const output = path.join(IMAGES, pkg.output);
    if (!(await exists(input))) {
      throw new Error(`Missing source: ${input}`);
    }
    const bytes = await optimizePackage(input, output);
    results.push({ file: pkg.output, bytes });
    console.log(`[images] ${pkg.output} — ${(bytes / 1024).toFixed(1)} KB`);
  }

  const heroInput = path.join(IMAGES, "hero-lagos.webp.png");
  const heroOutput = path.join(IMAGES, "hero-lagos.webp");
  if (!(await exists(heroInput))) {
    throw new Error(`Missing hero source: ${heroInput}`);
  }
  const heroBytes = await optimizeHero(heroInput, heroOutput);
  results.push({ file: "hero-lagos.webp", bytes: heroBytes });
  console.log(`[images] hero-lagos.webp — ${(heroBytes / 1024).toFixed(1)} KB`);

  const sizes = results.map((r) => r.bytes);
  const min = Math.min(...sizes);
  const max = Math.max(...sizes);
  console.log(`[images] Size range: ${(min / 1024).toFixed(1)}–${(max / 1024).toFixed(1)} KB`);

  // Remove bulky PNG sources after successful conversion
  const toRemove = [
    ...packages.map((p) => path.join(IMAGES, p.input)),
    heroInput
  ];
  for (const file of toRemove) {
    await fs.unlink(file);
    console.log(`[images] Removed source ${path.basename(file)}`);
  }

  console.log("[images] Marketing images ready in public/images/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
