import { describe, expect, it } from "vitest";
import type { GeoLocation } from "@/types/weather";
import {
  coordsFromLocation,
  dedupeLocations,
  sameLocation,
} from "@/utils/location-match";

function place(
  overrides: Partial<GeoLocation> & Pick<GeoLocation, "id" | "name">,
): GeoLocation {
  return {
    country: "France",
    countryCode: "FR",
    admin1: "Grand Est",
    latitude: 49.25,
    longitude: 4.03,
    displayName: `${overrides.name}, France`,
    ...overrides,
  };
}

describe("coordsFromLocation", () => {
  it("reads latitude/longitude", () => {
    expect(
      coordsFromLocation({ latitude: 48.8, longitude: 2.3 }),
    ).toEqual({ lat: 48.8, lon: 2.3 });
  });

  it("accepts lat/lon aliases", () => {
    expect(
      coordsFromLocation({
        latitude: undefined as unknown as number,
        longitude: undefined as unknown as number,
        lat: 45,
        lon: 5,
      }),
    ).toEqual({ lat: 45, lon: 5 });
  });

  it("rejects out-of-range coords", () => {
    expect(coordsFromLocation({ latitude: 99, longitude: 0 })).toBeNull();
    expect(coordsFromLocation({ latitude: 0, longitude: 200 })).toBeNull();
  });
});

describe("sameLocation", () => {
  it("matches by id", () => {
    const a = place({ id: "1", name: "Reims" });
    const b = place({ id: "1", name: "Other", latitude: 0, longitude: 0 });
    expect(sameLocation(a, b)).toBe(true);
  });

  it("matches nearby same name", () => {
    const a = place({ id: "a", name: "Reims", latitude: 49.25, longitude: 4.03 });
    const b = place({ id: "b", name: "Reims", latitude: 49.26, longitude: 4.04 });
    expect(sameLocation(a, b)).toBe(true);
  });

  it("rejects different names", () => {
    const a = place({ id: "a", name: "Reims" });
    const b = place({ id: "b", name: "Paris" });
    expect(sameLocation(a, b)).toBe(false);
  });
});

describe("dedupeLocations", () => {
  it("keeps first unique place", () => {
    const a = place({ id: "a", name: "Reims" });
    const b = place({ id: "b", name: "Reims", latitude: 49.251, longitude: 4.031 });
    const c = place({ id: "c", name: "Paris", latitude: 48.85, longitude: 2.35 });
    expect(dedupeLocations([a, b, c]).map((p) => p.id)).toEqual(["a", "c"]);
  });
});
