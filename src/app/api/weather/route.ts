import { NextResponse } from "next/server";
import { reverseGeocode, searchCities } from "@/services/nominatim";
import { getWeatherBundle } from "@/services/weather";
import { AppApiError } from "@/types/api";
import type { GeoLocation } from "@/types/weather";
import { jsonError, parseCoord } from "@/utils/api-response";

export const runtime = "nodejs";

/**
 * GET /api/weather?lat=&lon=
 * GET /api/weather?q=Paris
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    let location: GeoLocation;

    if (lat && lon) {
      const latitude = parseCoord(lat, "lat");
      const longitude = parseCoord(lon, "lon");
      try {
        location = await reverseGeocode(latitude, longitude);
      } catch {
        location = {
          id: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
          name: "Ma position",
          country: "",
          latitude,
          longitude,
          displayName: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        };
      }
    } else if (q && q.trim().length >= 2) {
      const results = await searchCities(q.trim(), 1);
      location = results[0];
    } else {
      throw new AppApiError(
        "BAD_REQUEST",
        "Fournissez q ou lat & lon.",
        400,
      );
    }

    const weather = await getWeatherBundle(location);
    return NextResponse.json(weather);
  } catch (error) {
    return jsonError(error);
  }
}
