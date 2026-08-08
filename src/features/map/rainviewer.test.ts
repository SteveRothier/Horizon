import { describe, expect, it } from "vitest";
import {
  latestRadarFrame,
  rainviewerTileUrl,
  type RainViewerMapsResponse,
} from "@/features/map/rainviewer";

const sample: RainViewerMapsResponse = {
  version: "2.0",
  generated: 1,
  host: "https://tilecache.rainviewer.com",
  radar: {
    past: [
      { time: 100, path: "/v2/radar/aaa" },
      { time: 200, path: "/v2/radar/bbb" },
    ],
    nowcast: [],
  },
};

describe("latestRadarFrame", () => {
  it("returns the most recent past frame", () => {
    expect(latestRadarFrame(sample)?.path).toBe("/v2/radar/bbb");
  });

  it("returns null when empty", () => {
    expect(
      latestRadarFrame({
        ...sample,
        radar: { past: [], nowcast: [] },
      }),
    ).toBeNull();
  });
});

describe("rainviewerTileUrl", () => {
  it("builds a Leaflet template URL", () => {
    expect(rainviewerTileUrl(sample.host, "/v2/radar/bbb")).toBe(
      "https://tilecache.rainviewer.com/v2/radar/bbb/256/{z}/{x}/{y}/2/1_1.png",
    );
  });
});
