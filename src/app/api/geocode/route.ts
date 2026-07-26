import { NextResponse } from "next/server";
import { reverseGeocode, searchCities } from "@/services/nominatim";
import { AppApiError } from "@/types/api";
import { jsonError, parseCoord } from "@/utils/api-response";

export const runtime = "nodejs";

/**
 * GET /api/geocode?q=Paris
 * GET /api/geocode?lat=48.85&lon=2.35  (reverse)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (lat && lon) {
      const location = await reverseGeocode(
        parseCoord(lat, "lat"),
        parseCoord(lon, "lon"),
      );
      return NextResponse.json({ location });
    }

    if (!q || q.trim().length < 2) {
      throw new AppApiError(
        "BAD_REQUEST",
        "Indiquez au moins 2 caractères (q) ou des coordonnées.",
        400,
      );
    }

    const limit = Math.min(
      Number(searchParams.get("limit") ?? 6) || 6,
      10,
    );
    const results = await searchCities(q, limit);
    return NextResponse.json({ results });
  } catch (error) {
    return jsonError(error);
  }
}
