import { describe, expect, it } from "vitest";
import { pinScaleForZoom } from "@/features/map/map-pin-scale";

describe("pinScaleForZoom", () => {
  it("returns full size at high zoom", () => {
    expect(pinScaleForZoom(12)).toBe(1);
    expect(pinScaleForZoom(14)).toBe(1);
  });

  it("shrinks stepwise when zooming out", () => {
    expect(pinScaleForZoom(10)).toBe(0.9);
    expect(pinScaleForZoom(8)).toBe(0.78);
    expect(pinScaleForZoom(6)).toBe(0.65);
    expect(pinScaleForZoom(4)).toBe(0.52);
  });
});
