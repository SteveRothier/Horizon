import { OPENWEATHER_BASE_URL } from "@/constants/api";
import { fetchJson } from "@/services/http";
import { AppApiError } from "@/types/api";
import type {
  AirQualityData,
  CurrentWeather,
  DailyForecastItem,
  GeoLocation,
  HourlyForecastItem,
  WeatherBundle,
} from "@/types/weather";
import {
  aqiLabelFromIndex,
  conditionFromWeatherCode,
  descriptionFromCondition,
  weatherCodeFromOpenWeather,
} from "@/utils/weather-code";

type OwWeather = {
  id: number;
  main: string;
  description: string;
  icon: string;
};

type OwCurrent = {
  coord: { lat: number; lon: number };
  weather: OwWeather[];
  main: {
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    temp_min?: number;
    temp_max?: number;
  };
  visibility: number;
  wind: { speed: number; deg: number };
  clouds: { all: number };
  dt: number;
  sys: { sunrise: number; sunset: number; country?: string };
  name: string;
  timezone: number;
};

type OwForecastItem = {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  weather: OwWeather[];
  clouds: { all: number };
  wind: { speed: number; deg: number };
  pop: number;
  dt_txt: string;
};

type OwForecast = {
  list: OwForecastItem[];
  city: {
    name: string;
    country: string;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
};

type OwAir = {
  list: Array<{
    main: { aqi: number };
    components: {
      co: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
    };
  }>;
};

function requireApiKey(): string {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    throw new AppApiError(
      "API_UNAVAILABLE",
      "Clé OpenWeather manquante.",
      503,
    );
  }
  return key;
}

function owIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function msToIso(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

/** OpenWeather wind is m/s → km/h */
function toKmh(ms: number): number {
  return Math.round(ms * 3.6 * 10) / 10;
}

/** US AQI 1–5 → approximate European-style scale for UI */
function mapOwAqi(usAqi: number): number {
  const map: Record<number, number> = {
    1: 15,
    2: 35,
    3: 55,
    4: 80,
    5: 110,
  };
  return map[usAqi] ?? 50;
}

export function isOpenWeatherConfigured(): boolean {
  return Boolean(process.env.OPENWEATHER_API_KEY);
}

export async function fetchOpenWeatherBundle(
  location: GeoLocation,
): Promise<WeatherBundle> {
  const key = requireApiKey();
  const { latitude: lat, longitude: lon } = location;

  const currentUrl = new URL(`${OPENWEATHER_BASE_URL}/weather`);
  currentUrl.searchParams.set("lat", String(lat));
  currentUrl.searchParams.set("lon", String(lon));
  currentUrl.searchParams.set("units", "metric");
  currentUrl.searchParams.set("lang", "fr");
  currentUrl.searchParams.set("appid", key);

  const forecastUrl = new URL(`${OPENWEATHER_BASE_URL}/forecast`);
  forecastUrl.searchParams.set("lat", String(lat));
  forecastUrl.searchParams.set("lon", String(lon));
  forecastUrl.searchParams.set("units", "metric");
  forecastUrl.searchParams.set("lang", "fr");
  forecastUrl.searchParams.set("appid", key);

  const [current, forecast] = await Promise.all([
    fetchJson<OwCurrent>(currentUrl.toString()),
    fetchJson<OwForecast>(forecastUrl.toString()),
  ]);

  const w = current.weather[0];
  const code = weatherCodeFromOpenWeather(w.id, w.main);
  const condition = conditionFromWeatherCode(code);
  const nowSec = current.dt;
  const isDay =
    nowSec >= current.sys.sunrise && nowSec < current.sys.sunset;

  const currentMapped: CurrentWeather = {
    temperature: current.main.temp,
    feelsLike: current.main.feels_like,
    humidity: current.main.humidity,
    windSpeed: toKmh(current.wind.speed),
    windDirection: current.wind.deg ?? 0,
    pressure: current.main.pressure,
    visibility: current.visibility ?? null,
    cloudCover: current.clouds.all,
    dewPoint: null,
    uvIndex: null,
    weatherCode: code,
    condition,
    description: descriptionFromCondition(
      condition,
      isDay,
      w.description
        ? w.description.charAt(0).toUpperCase() + w.description.slice(1)
        : undefined,
    ),
    icon: owIconUrl(w.icon),
    isDay,
    sunrise: msToIso(current.sys.sunrise),
    sunset: msToIso(current.sys.sunset),
    precipitationProbability: forecast.list[0]
      ? Math.round(forecast.list[0].pop * 100)
      : null,
  };

  const hourly: HourlyForecastItem[] = forecast.list.slice(0, 8).map((item) => {
    const iw = item.weather[0];
    const icode = weatherCodeFromOpenWeather(iw.id, iw.main);
    const icondition = conditionFromWeatherCode(icode);
    const itemIsDay = iw.icon.endsWith("d");
    return {
      time: item.dt_txt.replace(" ", "T"),
      temperature: item.main.temp,
      weatherCode: icode,
      condition: icondition,
      icon: owIconUrl(iw.icon),
      precipitationProbability: Math.round(item.pop * 100),
      isDay: itemIsDay,
    };
  });

  // Aggregate 3h slots into daily min/max
  const byDay = new Map<
    string,
    {
      mins: number[];
      maxs: number[];
      pops: number[];
      winds: number[];
      codes: number[];
      icons: string[];
    }
  >();

  for (const item of forecast.list) {
    const date = item.dt_txt.slice(0, 10);
    const iw = item.weather[0];
    const icode = weatherCodeFromOpenWeather(iw.id, iw.main);
    const bucket = byDay.get(date) ?? {
      mins: [],
      maxs: [],
      pops: [],
      winds: [],
      codes: [],
      icons: [],
    };
    bucket.mins.push(item.main.temp_min);
    bucket.maxs.push(item.main.temp_max);
    bucket.pops.push(item.pop * 100);
    bucket.winds.push(toKmh(item.wind.speed));
    bucket.codes.push(icode);
    bucket.icons.push(iw.icon);
    byDay.set(date, bucket);
  }

  const daily: DailyForecastItem[] = Array.from(byDay.entries())
    .slice(0, 7)
    .map(([date, bucket]) => {
      const mid = Math.floor(bucket.codes.length / 2);
      const code = bucket.codes[mid] ?? 0;
      return {
        date,
        weatherCode: code,
        condition: conditionFromWeatherCode(code),
        icon: owIconUrl(bucket.icons[mid] ?? "01d"),
        temperatureMin: Math.min(...bucket.mins),
        temperatureMax: Math.max(...bucket.maxs),
        precipitationProbability: Math.round(
          Math.max(...bucket.pops, 0),
        ),
        windSpeedMax: Math.max(...bucket.winds),
        uvIndexMax: null,
        sunrise: msToIso(forecast.city.sunrise),
        sunset: msToIso(forecast.city.sunset),
      };
    });

  return {
    location,
    current: currentMapped,
    hourly,
    daily,
    timezone: "UTC",
    source: "openweather",
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchOpenWeatherAirQuality(
  latitude: number,
  longitude: number,
): Promise<AirQualityData> {
  const key = requireApiKey();
  const url = new URL(`${OPENWEATHER_BASE_URL}/air_pollution`);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("appid", key);

  const data = await fetchJson<OwAir>(url.toString());
  const entry = data.list[0];
  if (!entry) {
    throw new AppApiError(
      "API_UNAVAILABLE",
      "Qualité de l’air indisponible.",
      502,
    );
  }

  const aqi = mapOwAqi(entry.main.aqi);
  return {
    aqi,
    aqiLabel: aqiLabelFromIndex(aqi),
    pm25: entry.components.pm2_5,
    pm10: entry.components.pm10,
    o3: entry.components.o3,
    no2: entry.components.no2,
    so2: entry.components.so2,
    co: entry.components.co,
    uvIndex: null,
  };
}

/** Enrich Open-Meteo bundle with OW icons/descriptions when key is present */
export async function enrichWithOpenWeatherIcons(
  bundle: WeatherBundle,
): Promise<WeatherBundle> {
  if (!isOpenWeatherConfigured()) return bundle;

  try {
    const key = requireApiKey();
    const url = new URL(`${OPENWEATHER_BASE_URL}/weather`);
    url.searchParams.set("lat", String(bundle.location.latitude));
    url.searchParams.set("lon", String(bundle.location.longitude));
    url.searchParams.set("units", "metric");
    url.searchParams.set("lang", "fr");
    url.searchParams.set("appid", key);

    const current = await fetchJson<OwCurrent>(url.toString());
    const w = current.weather[0];
    if (!w) return bundle;

    return {
      ...bundle,
      current: {
        ...bundle.current,
        description: descriptionFromCondition(
          bundle.current.condition,
          bundle.current.isDay,
          w.description
            ? w.description.charAt(0).toUpperCase() + w.description.slice(1)
            : undefined,
        ),
        icon: owIconUrl(w.icon),
        visibility: current.visibility ?? bundle.current.visibility,
      },
    };
  } catch {
    return bundle;
  }
}
