import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GeoLocation, WeatherBundle } from "@/types/weather";

vi.mock("@/utils/rate-limit", () => ({
  assertRateLimit: vi.fn(),
}));

vi.mock("@/services/nominatim", () => ({
  reverseGeocode: vi.fn(),
  searchCities: vi.fn(),
}));

vi.mock("@/services/weather", () => ({
  getWeatherBundle: vi.fn(),
  getAirQuality: vi.fn(),
}));

import { GET } from "@/app/api/weather/route";
import { reverseGeocode, searchCities } from "@/services/nominatim";
import { getAirQuality, getWeatherBundle } from "@/services/weather";

const paris: GeoLocation = {
  id: "paris",
  name: "Paris",
  country: "France",
  countryCode: "FR",
  latitude: 48.8566,
  longitude: 2.3522,
  displayName: "Paris, France",
};

const bundle = {
  location: paris,
  current: {
    temperature: 18,
    feelsLike: 17,
    humidity: 60,
    windSpeed: 10,
    windDirection: 180,
    pressure: 1015,
    visibility: 10000,
    cloudCover: 20,
    dewPoint: 10,
    uvIndex: 3,
    weatherCode: 0,
    condition: "clear",
    description: "Ensoleillé",
    isDay: true,
    sunrise: null,
    sunset: null,
    precipitationProbability: 10,
  },
  hourly: [],
  daily: [],
  timezone: "Europe/Paris",
  source: "open-meteo",
  fetchedAt: "2026-08-09T10:00:00.000Z",
} satisfies WeatherBundle;

describe("GET /api/weather", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWeatherBundle).mockResolvedValue(bundle);
    vi.mocked(getAirQuality).mockResolvedValue({
      aqi: 30,
      aqiLabel: "Bonne",
      pm25: null,
      pm10: null,
      o3: null,
      no2: null,
      so2: null,
      co: null,
      uvIndex: null,
    });
  });

  it("returns 400 without q or lat/lon", async () => {
    const res = await GET(new Request("http://localhost/api/weather"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe(true);
  });

  it("returns weather for lat/lon", async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(paris);

    const res = await GET(
      new Request("http://localhost/api/weather?lat=48.8566&lon=2.3522"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.location.name).toBe("Paris");
    expect(body.current.temperature).toBe(18);
    expect(getWeatherBundle).toHaveBeenCalled();
  });

  it("returns weather for city query", async () => {
    vi.mocked(searchCities).mockResolvedValue([paris]);

    const res = await GET(
      new Request("http://localhost/api/weather?q=Paris"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.location.name).toBe("Paris");
    expect(searchCities).toHaveBeenCalledWith("Paris", 1);
  });
});
