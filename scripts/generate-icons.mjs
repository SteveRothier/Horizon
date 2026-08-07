import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceSvg = path.join(root, "src", "assets", "icon.svg");
const publicDir = path.join(root, "public");

/** Pack PNG buffers into a multi-size .ico (PNG-compressed entries). */
function pngsToIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = [];

  for (const png of pngBuffers) {
    entries.push({ png, offset, size: png.length });
    offset += png.length;
  }

  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(count, 4);

  entries.forEach((entry, i) => {
    const o = 6 + i * 16;
    // 0 = 256px in ICO; we use actual dims from IHDR when possible
    out.writeUInt8(0, o);
    out.writeUInt8(0, o + 1);
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
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  mkdirSync(publicDir, { recursive: true });

  copyFileSync(sourceSvg, path.join(publicDir, "icon.svg"));

  const sizes = [
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ];

  for (const [name, size] of sizes) {
    const buf = await raster(size);
    writeFileSync(path.join(publicDir, name), buf);
    console.log(`wrote public/${name} (${size}x${size})`);
  }

  const png16 = await raster(16);
  const png32 = await raster(32);
  writeFileSync(path.join(publicDir, "favicon.ico"), pngsToIco([png16, png32]));
  console.log("wrote public/favicon.ico (16+32)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
