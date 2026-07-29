import { OPEN_METEO_AIR_URL, OPEN_METEO_FORECAST_URL } from "@/constants/api";
import { fetchJson } from "@/services/http";
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
} from "@/utils/weather-code";

type OpenMeteoForecast = {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    visibility?: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
    is_day: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: number[];
    uv_index_max: (number | null)[];
    sunrise: string[];
    sunset: string[];
  };
};

type OpenMeteoAir = {
  current?: {
    european_aqi?: number | null;
    pm2_5?: number | null;
    pm10?: number | null;
    ozone?: number | null;
    nitrogen_dioxide?: number | null;
    sulphur_dioxide?: number | null;
    carbon_monoxide?: number | null;
    uv_index?: number | null;
  };
  hourly?: {
    time: string[];
    european_aqi?: (number | null)[];
    pm2_5?: (number | null)[];
    pm10?: (number | null)[];
    ozone?: (number | null)[];
    nitrogen_dioxide?: (number | null)[];
    sulphur_dioxide?: (number | null)[];
    carbon_monoxide?: (number | null)[];
    uv_index?: (number | null)[];
  };
};

function buildForecastUrl(lat: number, lon: number): string {
  const url = new URL(OPEN_METEO_FORECAST_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "cloud_cover",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
      "visibility",
    ].join(","),
  );
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "precipitation_probability",
      "weather_code",
      "is_day",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","),
  );
  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "uv_index_max",
      "sunrise",
      "sunset",
    ].join(","),
  );
  url.searchParams.set("wind_speed_unit", "kmh");
  return url.toString();
}

function pickHourly(
  data: OpenMeteoForecast,
  fromIndex: number,
  count: number,
): HourlyForecastItem[] {
  const items: HourlyForecastItem[] = [];
  const end = Math.min(fromIndex + count, data.hourly.time.length);

  for (let i = fromIndex; i < end; i++) {
    const code = data.hourly.weather_code[i] ?? 0;
    const isDay = data.hourly.is_day[i] === 1;
    const condition = conditionFromWeatherCode(code);
    items.push({
      time: data.hourly.time[i],
      temperature: data.hourly.temperature_2m[i],
      weatherCode: code,
      condition,
      precipitationProbability: data.hourly.precipitation_probability[i] ?? 0,
      windSpeed: data.hourly.wind_speed_10m[i] ?? 0,
      windDirection: data.hourly.wind_direction_10m[i] ?? 0,
      isDay,
    });
  }
  return items;
}

function mapDaily(data: OpenMeteoForecast): DailyForecastItem[] {
  return data.daily.time.map((date, i) => {
    const code = data.daily.weather_code[i] ?? 0;
    const condition = conditionFromWeatherCode(code);
    return {
      date,
      weatherCode: code,
      condition,
      temperatureMin: data.daily.temperature_2m_min[i],
      temperatureMax: data.daily.temperature_2m_max[i],
      precipitationProbability:
        data.daily.precipitation_probability_max[i] ?? 0,
      windSpeedMax: data.daily.wind_speed_10m_max[i],
      uvIndexMax: data.daily.uv_index_max[i] ?? null,
      sunrise: data.daily.sunrise[i] ?? null,
      sunset: data.daily.sunset[i] ?? null,
    };
  });
}

function mapCurrent(
  data: OpenMeteoForecast,
  airUv: number | null,
): CurrentWeather {
  const code = data.current.weather_code;
  const isDay = data.current.is_day === 1;
  const condition = conditionFromWeatherCode(code);
  const uvFromDaily = data.daily.uv_index_max?.[0] ?? null;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    pressure: data.current.pressure_msl,
    visibility:
      data.current.visibility != null ? data.current.visibility : null,
    cloudCover: data.current.cloud_cover,
    dewPoint: null,
    uvIndex: airUv ?? uvFromDaily,
    weatherCode: code,
    condition,
    description: descriptionFromCondition(condition, isDay),
    isDay,
    sunrise: data.daily.sunrise?.[0] ?? null,
    sunset: data.daily.sunset?.[0] ?? null,
    precipitationProbability:
      data.hourly.precipitation_probability?.[0] ?? null,
  };
}

export async function fetchOpenMeteoWeather(
  location: GeoLocation,
): Promise<WeatherBundle> {
  const data = await fetchJson<OpenMeteoForecast>(
    buildForecastUrl(location.latitude, location.longitude),
    { next: { revalidate: 300 } },
  );

  const now = Date.now();
  let startHourly = 0;
  for (let i = 0; i < data.hourly.time.length; i++) {
    if (new Date(data.hourly.time[i]).getTime() >= now - 30 * 60 * 1000) {
      startHourly = i;
      break;
    }
  }

  return {
    location,
    current: mapCurrent(data, null),
    hourly: pickHourly(data, startHourly, 24),
    daily: mapDaily(data),
    timezone: data.timezone,
    source: "open-meteo",
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchOpenMeteoAirQuality(
  latitude: number,
  longitude: number,
): Promise<AirQualityData> {
  const url = new URL(OPEN_METEO_AIR_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set(
    "current",
    [
      "european_aqi",
      "pm2_5",
      "pm10",
      "ozone",
      "nitrogen_dioxide",
      "sulphur_dioxide",
      "carbon_monoxide",
      "uv_index",
    ].join(","),
  );
  url.searchParams.set(
    "hourly",
    ["european_aqi", "pm2_5", "pm10", "ozone", "uv_index"].join(","),
  );

  const data = await fetchJson<OpenMeteoAir>(url.toString(), {
    next: { revalidate: 300 },
  });

  const current = data.current;
  const aqi = current?.european_aqi ?? data.hourly?.european_aqi?.[0] ?? null;

  return {
    aqi,
    aqiLabel: aqiLabelFromIndex(aqi),
    pm25: current?.pm2_5 ?? data.hourly?.pm2_5?.[0] ?? null,
    pm10: current?.pm10 ?? data.hourly?.pm10?.[0] ?? null,
    o3: current?.ozone ?? data.hourly?.ozone?.[0] ?? null,
    no2: current?.nitrogen_dioxide ?? null,
    so2: current?.sulphur_dioxide ?? null,
    co: current?.carbon_monoxide ?? null,
    uvIndex: current?.uv_index ?? data.hourly?.uv_index?.[0] ?? null,
  };
}
