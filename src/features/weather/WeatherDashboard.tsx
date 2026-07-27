"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ErrorCard } from "@/components/ui/ErrorCard";
import {
  DashboardSkeleton,
  GaugeSkeleton,
  MapSkeleton,
} from "@/components/ui/skeletons";
import { SearchBar } from "@/features/header/SearchBar";
import { GeolocationButton } from "@/features/header/GeolocationButton";
import { FavoritesList } from "@/features/favorites/FavoritesList";
import { HistoryList } from "@/features/history/HistoryList";
import { HourlyForecast } from "@/features/forecast/HourlyForecast";
import { WeeklyForecast } from "@/features/forecast/WeeklyForecast";
import { MapPlaceholder } from "@/features/map/MapPlaceholder";
import { AirQuality } from "@/features/weather/AirQuality";
import { UVIndex } from "@/features/weather/UVIndex";
import { WeatherDetails } from "@/features/weather/WeatherDetails";
import { WeatherHero } from "@/features/weather/WeatherHero";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { SpeedUnitToggle } from "@/components/ui/SpeedUnitToggle";
import { useAirQuality, useWeather } from "@/hooks/useWeather";
import { useLocationStore } from "@/stores/locationStore";
import { AppApiError } from "@/types/api";
import type { DayPeriod } from "@/types/weather";

function errorMessage(error: unknown): string {
  if (error instanceof AppApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Impossible de charger la météo.";
}

export function WeatherDashboard() {
  const location = useLocationStore((s) => s.location);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const coords = hydrated
    ? { lat: location.latitude, lon: location.longitude }
    : null;

  const weatherQuery = useWeather(coords);
  const airQuery = useAirQuality(coords);

  const weather = weatherQuery.data;
  const period: DayPeriod = weather?.current.isDay ? "day" : "night";
  const condition = weather?.current.condition ?? "clear";

  const isLoading = !hydrated || weatherQuery.isLoading;
  const isError = weatherQuery.isError;

  return (
    <AppShell
      weather={condition}
      period={period}
      searchSlot={<SearchBar />}
      geolocationSlot={<GeolocationButton onError={setGeoError} />}
      settingsSlot={
        <>
          <SpeedUnitToggle className="hidden sm:flex" />
          <LocaleToggle className="hidden md:flex" />
        </>
      }
      favoritesSlot={<FavoritesList />}
      historySlot={<HistoryList />}
    >
      {geoError ? (
        <div
          className="mb-2 shrink-0 rounded-[var(--glass-radius-sm)] border border-[var(--surface-error-border)] bg-[var(--surface-error)] px-3 py-2 text-sm"
          role="status"
        >
          {geoError}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setGeoError(null)}
          >
            Fermer
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorCard
          message={errorMessage(weatherQuery.error)}
          onRetry={() => weatherQuery.refetch()}
          className="min-h-[12rem]"
        />
      ) : weather ? (
        <DashboardLayout
          hero={
            <WeatherHero location={weather.location} current={weather.current} />
          }
          hourly={<HourlyForecast items={weather.hourly} />}
          weekly={<WeeklyForecast items={weather.daily} />}
          details={<WeatherDetails current={weather.current} />}
          airQuality={
            airQuery.isLoading ? (
              <GaugeSkeleton label="Qualité de l'air" />
            ) : airQuery.isError ? (
              <ErrorCard
                message={errorMessage(airQuery.error)}
                onRetry={() => airQuery.refetch()}
              />
            ) : airQuery.data ? (
              <AirQuality data={airQuery.data} />
            ) : (
              <GaugeSkeleton label="Qualité de l'air" />
            )
          }
          uv={
            <UVIndex
              value={
                airQuery.data?.uvIndex ??
                weather.current.uvIndex ??
                weather.daily[0]?.uvIndexMax ??
                null
              }
            />
          }
          map={
            weatherQuery.isFetching && !weather ? (
              <MapSkeleton />
            ) : (
              <MapPlaceholder location={weather.location} />
            )
          }
        />
      ) : (
        <DashboardSkeleton />
      )}
    </AppShell>
  );
}

