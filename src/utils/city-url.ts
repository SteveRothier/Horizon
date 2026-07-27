import { slugifyCity } from "@/utils/weather-code";
import type { GeoLocation } from "@/types/weather";

export function queryFromSlug(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ").trim();
}

export function titleFromSlug(slug: string): string {
  return queryFromSlug(slug)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function toCityPath(location: Pick<GeoLocation, "name">): string {
  return `/weather/${slugifyCity(location.name)}`;
}
