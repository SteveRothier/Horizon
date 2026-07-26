import { NextResponse } from "next/server";
import { getAirQuality } from "@/services/weather";
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
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error);
  }
}
