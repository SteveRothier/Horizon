import type { MetadataRoute } from "next";

const CITIES = [
  "paris",
  "lyon",
  "marseille",
  "bordeaux",
  "lille",
  "toulouse",
  "nantes",
  "nice",
  "london",
  "berlin",
  "madrid",
  "rome",
  "brussels",
  "amsterdam",
  "new-york",
  "tokyo",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

  const home: MetadataRoute.Sitemap[number] = {
    url: base ? `${base}/` : "/",
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  };

  const cities = CITIES.map((city) => ({
    url: base ? `${base}/weather/${city}` : `/weather/${city}`,
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  return [home, ...cities];
}
