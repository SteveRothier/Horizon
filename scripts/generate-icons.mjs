import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceSvg = path.join(root, "src", "assets", "icon.svg");
const publicDir = path.join(root, "public");

/** PWA / launcher sizes (any purpose). */
const ICON_SIZES = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

/**
 * Pack PNG buffers into a multi-size .ico (PNG-compressed entries).
 * @param {{ png: Buffer, width: number, height: number }[]} images
 */
function pngsToIco(images) {
  const count = images.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = images.map((img) => {
    const entry = { ...img, offset, size: img.png.length };
    offset += img.png.length;
    return entry;
  });

  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(count, 4);

  entries.forEach((entry, i) => {
    const o = 6 + i * 16;
    out.writeUInt8(entry.width >= 256 ? 0 : entry.width, o);
    out.writeUInt8(entry.height >= 256 ? 0 : entry.height, o + 1);
    out.writeUInt8(0, o + 2);
    out.writeUInt8(0, o + 3);
    out.writeUInt16LE(1, o + 4);
    out.writeUInt16LE(32, o + 6);
    out.writeUInt32LE(entry.size, o + 8);
    out.writeUInt32LE(entry.offset, o + 12);
    entry.png.copy(out, entry.offset);
  });

  return out;
}

async function raster(size) {
  const svg = readFileSync(sourceSvg);
  return sharp(svg, { density: Math.max(72, size * 3) })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** Maskable: solid bg + mark at ~80% (Android safe zone). */
async function rasterMaskable(size) {
  const markSize = Math.round(size * 0.8);
  const mark = await raster(markSize);
  const offset = Math.round((size - markSize) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 11, g: 18, b: 38, alpha: 1 }, // #0b1226
    },
  })
    .composite([{ input: mark, left: offset, top: offset }])
    .png()
    .toBuffer();
}

async function main() {
  mkdirSync(publicDir, { recursive: true });

  copyFileSync(sourceSvg, path.join(publicDir, "icon.svg"));

  for (const size of ICON_SIZES) {
    const buf = await raster(size);
    const name = `icon-${size}.png`;
    writeFileSync(path.join(publicDir, name), buf);
    console.log(`wrote public/${name} (${size}x${size})`);
  }

  const apple = await raster(180);
  writeFileSync(path.join(publicDir, "apple-touch-icon.png"), apple);
  console.log("wrote public/apple-touch-icon.png (180x180)");

  for (const size of [192, 512]) {
    const buf = await rasterMaskable(size);
    const name = `icon-${size}-maskable.png`;
    writeFileSync(path.join(publicDir, name), buf);
    console.log(`wrote public/${name} (${size}x${size} maskable)`);
  }

  const png16 = await raster(16);
  const png32 = await raster(32);
  writeFileSync(path.join(publicDir, "favicon-32.png"), png32);
  console.log("wrote public/favicon-32.png (32x32)");

  writeFileSync(
    path.join(publicDir, "favicon.ico"),
    pngsToIco([
      { png: png16, width: 16, height: 16 },
      { png: png32, width: 32, height: 32 },
    ]),
  );
  console.log("wrote public/favicon.ico (16+32)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
