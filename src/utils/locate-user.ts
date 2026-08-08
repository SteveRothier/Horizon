import type { GeoLocation } from "@/types/weather";

/**
 * Resolve device geolocation then reverse-geocode to a GeoLocation.
 * Shared by header button and map locate control.
 */
export async function locateUserPosition(
  reverseGeocode: (lat: number, lon: number) => Promise<GeoLocation>,
): Promise<GeoLocation> {
  if (!navigator.geolocation) {
    throw Object.assign(new Error("unsupported"), { code: -1 });
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 20_000,
      maximumAge: 120_000,
    });
  });

  const { latitude, longitude } = position.coords;
  return reverseGeocode(latitude, longitude);
}

export function isGeolocationError(
  err: unknown,
): err is { code: number } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "number"
  );
}
