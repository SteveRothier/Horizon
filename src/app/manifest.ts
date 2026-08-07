import type { MetadataRoute } from "next";

const ICON_SIZES = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Horizon",
    short_name: "Horizon",
    description:
      "Application météo Horizon",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1226",
    theme_color: "#1a2744",
    icons: [
      ...ICON_SIZES.map((n) => ({
        src: `/icon-${n}.png`,
        sizes: `${n}x${n}`,
        type: "image/png",
        purpose: "any" as const,
      })),
      {
        src: "/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
