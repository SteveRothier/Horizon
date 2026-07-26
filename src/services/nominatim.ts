import {
  NOMINATIM_REVERSE_URL,
  NOMINATIM_SEARCH_URL,
  NOMINATIM_USER_AGENT,
} from "@/constants/api";
import { fetchJson } from "@/services/http";
import { AppApiError } from "@/types/api";
import type { GeoLocation } from "@/types/weather";
import { slugifyCity } from "@/utils/weather-code";

type NominatimItem = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  class?: string;
  type?: string;
};

function toGeoLocation(item: NominatimItem): GeoLocation {
  const address = item.address ?? {};
  const name =
    item.name ||
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    item.display_name.split(",")[0]?.trim() ||
    "Lieu inconnu";

  const country = address.country ?? "";
  const countryCode = address.country_code?.toUpperCase();
  const admin1 = address.state;
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);

  return {
    id: `${slugifyCity(name)}-${item.place_id}`,
    name,
    country,
    countryCode,
    admin1,
    latitude,
    longitude,
    displayName: [name, admin1, country].filter(Boolean).join(", "),
  };
}

const nominatimHeaders = {
  Accept: "application/json",
  "User-Agent": NOMINATIM_USER_AGENT,
};

export async function searchCities(
  query: string,
  limit = 6,
): Promise<GeoLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(limit));

  const data = await fetchJson<NominatimItem[]>(url.toString(), {
    headers: nominatimHeaders,
    next: { revalidate: 3600 },
  });

  const places = data
    .map(toGeoLocation)
    .filter(
      (p) =>
        Number.isFinite(p.latitude) &&
        Number.isFinite(p.longitude) &&
        p.name.length > 0,
    );

  if (places.length === 0) {
    throw new AppApiError(
      "CITY_NOT_FOUND",
      `Aucune ville trouvée pour « ${q} ».`,
      404,
    );
  }

  return places;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeoLocation> {
  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "10");

  const data = await fetchJson<NominatimItem>(url.toString(), {
    headers: nominatimHeaders,
    next: { revalidate: 3600 },
  });

  if (!data?.lat || !data?.lon) {
    throw new AppApiError(
      "CITY_NOT_FOUND",
      "Impossible d’identifier ce lieu.",
      404,
    );
  }

  return toGeoLocation(data);
}
