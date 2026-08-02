export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "rain"
  | "storm"
  | "snow"
  | "fog";

export type DayPeriod = "day" | "night";

export type WeatherSource = "open-meteo" | "openweather";

export type GeoLocation = {
  id: string;
  name: string;
  country: string;
  countryCode?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  displayName: string;
};

export type CurrentWeather = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number | null;
  cloudCover: number;
  dewPoint: number | null;
  uvIndex: number | null;
  weatherCode: number;
  condition: WeatherCondition;
  description: string;
  isDay: boolean;
  sunrise: string | null;
  sunset: string | null;
  precipitationProbability: number | null;
};

export type HourlyForecastItem = {
  time: string;
  temperature: number;
  weatherCode: number;
  condition: WeatherCondition;
  precipitationProbability: number;
  windSpeed: number;
  windDirection: number;
  isDay: boolean;
};

export type DailyForecastItem = {
  date: string;
  weatherCode: number;
  condition: WeatherCondition;
  temperatureMin: number;
  temperatureMax: number;
  precipitationProbability: number;
  windSpeedMax: number;
  uvIndexMax: number | null;
  sunrise: string | null;
  sunset: string | null;
};

export type AirQualityData = {
  aqi: number | null;
  aqiLabel: string;
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  uvIndex: number | null;
};

export type WeatherBundle = {
  location: GeoLocation;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  timezone: string;
  source: WeatherSource;
  fetchedAt: string;
};
