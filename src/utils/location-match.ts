import type { GeoLocation } from "@/types/weather";

/** Same place even when Nominatim / default IDs differ. */
export function sameLocation(a: GeoLocation, b: GeoLocation): boolean {
  if (a.id === b.id) return true;

  const nameA = a.name.trim().toLowerCase();
  const nameB = b.name.trim().toLowerCase();
  if (!nameA || nameA !== nameB) return false;

  const dLat = Math.abs(a.latitude - b.latitude);
  const dLon = Math.abs(a.longitude - b.longitude);
  if (dLat <= 0.08 && dLon <= 0.08) return true;

  const labelA = a.displayName.trim().toLowerCase();
  const labelB = b.displayName.trim().toLowerCase();
  if (labelA && labelA === labelB) return true;

  const countryA = (a.countryCode ?? a.country).trim().toLowerCase();
  const countryB = (b.countryCode ?? b.country).trim().toLowerCase();
  const adminA = (a.admin1 ?? "").trim().toLowerCase();
  const adminB = (b.admin1 ?? "").trim().toLowerCase();
  if (countryA && countryA === countryB && adminA === adminB) return true;

  return false;
}

/** Keep first occurrence of each unique place. */
export function dedupeLocations(places: GeoLocation[]): GeoLocation[] {
  const unique: GeoLocation[] = [];
  for (const place of places) {
    if (unique.some((existing) => sameLocation(existing, place))) continue;
    unique.push(place);
  }
  return unique;
}
