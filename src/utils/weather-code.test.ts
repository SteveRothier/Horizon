import { describe, expect, it } from "vitest";
import { conditionFromWeatherCode } from "@/utils/weather-code";

describe("conditionFromWeatherCode", () => {
  it("maps clear / partly / overcast distinctly", () => {
    expect(conditionFromWeatherCode(0)).toBe("clear");
    expect(conditionFromWeatherCode(1)).toBe("partly");
    expect(conditionFromWeatherCode(2)).toBe("partly");
    expect(conditionFromWeatherCode(3)).toBe("cloudy");
  });

  it("maps drizzle / rain / freezing distinctly", () => {
    expect(conditionFromWeatherCode(51)).toBe("drizzle");
    expect(conditionFromWeatherCode(61)).toBe("rain");
    expect(conditionFromWeatherCode(56)).toBe("freezing");
    expect(conditionFromWeatherCode(66)).toBe("freezing");
  });

  it("maps fog, snow, storm and hail", () => {
    expect(conditionFromWeatherCode(45)).toBe("fog");
    expect(conditionFromWeatherCode(71)).toBe("snow");
    expect(conditionFromWeatherCode(95)).toBe("storm");
    expect(conditionFromWeatherCode(96)).toBe("hail");
    expect(conditionFromWeatherCode(99)).toBe("hail");
  });
});
