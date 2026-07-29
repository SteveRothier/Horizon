import { getAirQuality } from "@/services/weather";
import { cachedJson } from "@/utils/api-cache";
import { jsonError, parseCoord } from "@/utils/api-response";

export const runtime = "nodejs";

/**
 * GET /api/air-quality?lat=&lon=
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseCoord(searchParams.get("lat"), "lat");
    const longitude = parseCoord(searchParams.get("lon"), "lon");
    const data = await getAirQuality(latitude, longitude);
    return cachedJson(data, 300);
  } catch (error) {
    return jsonError(error);
  }
}
