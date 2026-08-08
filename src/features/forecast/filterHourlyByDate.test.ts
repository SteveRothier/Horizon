import { describe, expect, it } from "vitest";
import type { HourlyForecastItem } from "@/types/weather";
import {
  dateKeyFromTime,
  filterHourlyByDate,
} from "@/features/forecast/filterHourlyByDate";

function hour(time: string): HourlyForecastItem {
  return {
    time,
    temperature: 12,
    weatherCode: 0,
    condition: "clear",
    precipitationProbability: 0,
    windSpeed: 5,
    windDirection: 180,
    isDay: true,
  };
}

describe("dateKeyFromTime", () => {
  it("slices ISO local timestamps", () => {
    expect(dateKeyFromTime("2026-08-08T14:00")).toBe("2026-08-08");
  });
});

describe("filterHourlyByDate", () => {
  const hourly = [
    hour("2026-08-07T22:00"),
    hour("2026-08-08T08:00"),
    hour("2026-08-08T15:00"),
    hour("2026-08-09T09:00"),
  ];

  it("keeps slots for the selected day", () => {
    const result = filterHourlyByDate(hourly, "2026-08-08", {
      fromNowIfToday: false,
    });
    expect(result.map((h) => h.time)).toEqual([
      "2026-08-08T08:00",
      "2026-08-08T15:00",
    ]);
  });

  it("drops past hours when filtering today", () => {
    const result = filterHourlyByDate(hourly, "2026-08-08", {
      todayDate: "2026-08-08",
      now: new Date("2026-08-08T14:00:00"),
    });
    expect(result.map((h) => h.time)).toEqual(["2026-08-08T15:00"]);
  });
});
