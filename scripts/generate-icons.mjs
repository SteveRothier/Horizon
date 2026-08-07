import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceSvg = path.join(root, "src", "assets", "icon.svg");
const publicDir = path.join(root, "public");

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
    // ICO: 0 means 256; for 16/32 write the real size.
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
