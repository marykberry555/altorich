import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const source = path.join(ROOT, "public/brand/icon-dark.webp");
const outDir = path.join(ROOT, "public/admin-app");

async function png(size, filename, maskable = false) {
  let pipeline = sharp(source).resize(size, size, { fit: "cover", position: "centre" });
  if (maskable) {
    const inset = Math.round(size * 0.12);
    pipeline = sharp(source)
      .resize(size - inset * 2, size - inset * 2, { fit: "cover", position: "centre" })
      .extend({
        top: inset,
        bottom: inset,
        left: inset,
        right: inset,
        background: { r: 9, g: 9, b: 11, alpha: 1 }
      });
  }
  await pipeline.png({ compressionLevel: 9 }).toFile(path.join(outDir, filename));
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await png(192, "icon-192.png");
  await png(512, "icon-512.png");
  await png(512, "icon-512-maskable.png", true);
  await sharp(source)
    .resize(512, 512, { fit: "cover", position: "centre" })
    .extend({
      top: 180,
      bottom: 180,
      left: 0,
      right: 0,
      background: { r: 9, g: 9, b: 11, alpha: 1 }
    })
    .png()
    .toFile(path.join(outDir, "splash.png"));
  console.log("Admin app icons generated in public/admin-app/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
