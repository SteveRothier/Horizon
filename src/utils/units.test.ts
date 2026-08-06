import { describe, expect, it } from "vitest";
import {
  celsiusToFahrenheit,
  formatSpeed,
  formatTemp,
  formatVisibility,
  kmhToMph,
} from "@/utils/units";

describe("units", () => {
  it("converts celsius to fahrenheit", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
  });

  it("formats temperature with unit", () => {
    expect(formatTemp(20, "celsius")).toBe("20°");
    expect(formatTemp(0, "fahrenheit")).toBe("32°");
  });

  it("formats speed with unit", () => {
    expect(formatSpeed(10, "kmh")).toBe("10 km/h");
    expect(formatSpeed(10, "mph")).toBe(`${Math.round(kmhToMph(10))} mph`);
  });

  it("formats visibility", () => {
    expect(formatVisibility(null, "kmh")).toBe("—");
    expect(formatVisibility(5000, "kmh")).toBe("5.0 km");
    expect(formatVisibility(1609.344, "mph")).toBe("1.0 mi");
  });
});
