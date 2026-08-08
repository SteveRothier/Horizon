import { describe, expect, it } from "vitest";
import { conditionFromWeatherCode } from "@/utils/weather-code";

describe("conditionFromWeatherCode", () => {
  it("maps clear / partly / overcast distinctly", () => {
    expect(conditionFromWeatherCode(0)).toBe("clear");
    expect(conditionFromWeatherCode(1)).toBe("partly");
    expect(conditionFromWeatherCode(2)).toBe("partly");
    expect(conditionFromWeatherCode(3)).toBe("cloudy");
  });

  it("maps precip and fog codes", () => {
    expect(conditionFromWeatherCode(45)).toBe("fog");
    expect(conditionFromWeatherCode(61)).toBe("rain");
    expect(conditionFromWeatherCode(71)).toBe("snow");
    expect(conditionFromWeatherCode(95)).toBe("storm");
  });
});
