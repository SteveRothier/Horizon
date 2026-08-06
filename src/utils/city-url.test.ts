import { describe, expect, it } from "vitest";
import {
  queryFromSlug,
  titleFromSlug,
  toCityPath,
} from "@/utils/city-url";

describe("city-url", () => {
  it("queryFromSlug decodes and replaces dashes", () => {
    expect(queryFromSlug("paris")).toBe("paris");
    expect(queryFromSlug("new-york")).toBe("new york");
    expect(queryFromSlug("saint-etienne")).toBe("saint etienne");
  });

  it("titleFromSlug title-cases words", () => {
    expect(titleFromSlug("paris")).toBe("Paris");
    expect(titleFromSlug("new-york")).toBe("New York");
  });

  it("toCityPath slugifies location name", () => {
    expect(toCityPath({ name: "Paris" })).toBe("/weather/paris");
    expect(toCityPath({ name: "New York" })).toMatch(/^\/weather\//);
  });
});
