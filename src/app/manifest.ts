import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Horizon",
    short_name: "Horizon",
    description:
      "Application météo moderne — expérience immersive glassmorphism",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1226",
    theme_color: "#1a2744",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
