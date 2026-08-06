"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { DashboardSkeleton, MapSkeleton } from "@/components/ui/skeletons";
import {
  StableFavoritesSlot,
  StableGeolocationSlot,
  StableHistorySlot,
  StableSearchSlot,
  StableSettingsSlot,
  useStableGeoHandlers,
} from "@/features/weather/HeaderSlots";
import { DaySelectionProvider } from "@/features/forecast/DaySelectionContext";
import { ForecastPanelSlot } from "@/features/forecast/ForecastSlots";
import {
  AirQualitySlot,
  UVIndexSlot,
} from "@/features/weather/WeatherSlots";
import { WeatherMap } from "@/features/map/WeatherMap";
import { WeatherDetails } from "@/features/weather/WeatherDetails";
import { WeatherHero } from "@/features/weather/WeatherHero";
import { CityCrossfade } from "@/features/weather/CityCrossfade";
import { useCitySearch } from "@/hooks/useGeocode";
import { usePersistHydrated } from "@/hooks/usePersistHydrated";
import { useT } from "@/hooks/useT";
import { useWeather } from "@/hooks/useWeather";
import { useLocationStore } from "@/stores/locationStore";
import { DEFAULT_PERIOD, DEFAULT_WEATHER } from "@/constants/design";
import type { DayPeriod, WeatherCondition } from "@/types/weather";
import { messageFromApiError } from "@/utils/api-error";
import { queryFromSlug, toCityPath } from "@/utils/city-url";
import { selectLocation } from "@/utils/selectLocation";
import { slugifyCity } from "@/utils/weather-code";

type SceneState = {
  condition: WeatherCondition;
  period: DayPeriod;
};

type WeatherDashboardProps = {
  citySlug?: string;
};

export function WeatherDashboard({ citySlug }: WeatherDashboardProps) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const location = useLocationStore((s) => s.location);
  const hydrated = usePersistHydrated(useLocationStore);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [scene, setScene] = useState<SceneState>({
    condition: DEFAULT_WEATHER,
    period: DEFAULT_PERIOD,
  });
  const geoHandlers = useStableGeoHandlers(setGeoError);
  /** URL slug already applied to the store — prevents URL↔store ping-pong. */
  const urlSyncedSlugRef = useRef<string | null>(null);

  const storeSlug = slugifyCity(location.name);
  const slugQuery = citySlug ? queryFromSlug(citySlug) : "";
  const slugGeocodeEnabled =
    Boolean(citySlug && hydrated && slugQuery.length >= 2);
  const slugGeocode = useCitySearch(slugQuery, slugGeocodeEnabled);

  useEffect(() => {
    if (!slugGeocodeEnabled || !citySlug) {
      setSlugError(null);
      return;
    }
    if (slugGeocode.isFetching) return;

    // Already synced this URL slug — don't overwrite a later user pick (search/geo).
    if (urlSyncedSlugRef.current === citySlug) {
      setSlugError(null);
      return;
    }

    if (slugGeocode.isError) {
      setSlugError(
        messageFromApiError(slugGeocode.error, t, "error.slugNotFound"),
      );
      urlSyncedSlugRef.current = citySlug;
      return;
    }

    const match = slugGeocode.data?.[0];
    if (match) {
      const sameCoords =
        Math.abs(match.latitude - location.latitude) < 1e-4 &&
        Math.abs(match.longitude - location.longitude) < 1e-4;
      if (storeSlug !== citySlug || !sameCoords) {
        selectLocation(match);
      }
      urlSyncedSlugRef.current = citySlug;
      setSlugError(null);
    } else if (slugGeocode.isSuccess) {
      setSlugError(t("error.slugNotFound"));
      urlSyncedSlugRef.current = citySlug;
    }
  }, [
    slugGeocodeEnabled,
    slugGeocode.isFetching,
    slugGeocode.isError,
    slugGeocode.isSuccess,
    slugGeocode.data,
    slugGeocode.error,
    storeSlug,
    citySlug,
    location.latitude,
    location.longitude,
    t,
  ]);

  const awaitingUrlSync =
    Boolean(citySlug) &&
    urlSyncedSlugRef.current !== citySlug &&
    storeSlug !== citySlug;

  const slugResolving =
    slugGeocodeEnabled &&
    (slugGeocode.isFetching || !slugGeocode.isFetched || awaitingUrlSync);

  useEffect(() => {
    if (!hydrated || slugResolving) return;

    // Still applying URL → store for this slug: don't push store back to URL.
    if (
      citySlug &&
      urlSyncedSlugRef.current !== citySlug &&
      storeSlug !== citySlug
    ) {
      return;
    }

    const path = toCityPath(location);
    if (pathname !== path) {
      router.replace(path);
    }
  }, [
    hydrated,
    slugResolving,
    citySlug,
    storeSlug,
    location,
    pathname,
    router,
  ]);

  const coords =
    hydrated && !slugResolving
      ? { lat: location.latitude, lon: location.longitude }
      : null;

  const weatherQuery = useWeather(coords);
  const weather = weatherQuery.data;

  useEffect(() => {
    if (!weather) return;
    setScene({
      condition: weather.current.condition,
      period: weather.current.isDay ? "day" : "night",
    });
  }, [weather]);

  const todayDate = weather?.daily[0]?.date ?? null;
  const isLoading = !hydrated || slugResolving || weatherQuery.isLoading;
  const isError = weatherQuery.isError;

  return (
    <AppShell
      weather={scene.condition}
      period={scene.period}
      searchSlot={<StableSearchSlot />}
      geolocationSlot={
        <StableGeolocationSlot
          onError={geoHandlers.onError}
          onSuccess={geoHandlers.onSuccess}
        />
      }
      settingsSlot={<StableSettingsSlot />}
      favoritesSlot={<StableFavoritesSlot />}
      historySlot={<StableHistorySlot />}
    >
      <OfflineBanner />

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
            {t("error.close")}
          </button>
        </div>
      ) : null}

      {slugError ? (
        <div
          className="mb-2 shrink-0 rounded-[var(--glass-radius-sm)] border border-[var(--surface-error-border)] bg-[var(--surface-error)] px-3 py-2 text-sm"
          role="status"
        >
          {slugError}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setSlugError(null)}
          >
            {t("error.close")}
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="min-h-0 w-full flex-1 overflow-hidden">
          <DashboardSkeleton />
        </div>
      ) : isError ? (
        <ErrorCard
          message={messageFromApiError(weatherQuery.error, t)}
          onRetry={() => weatherQuery.refetch()}
          className="min-h-[12rem]"
        />
      ) : weather && coords ? (
        <CityCrossfade
          locationId={weather.location.id}
          className="w-full min-w-0 sm:h-full sm:min-h-0"
        >
          <DaySelectionProvider
            todayDate={todayDate}
            resetKey={`${weather.location.id}:${weather.fetchedAt}`}
          >
            <DashboardLayout
              hero={
                <WeatherHero
                  location={weather.location}
                  current={weather.current}
                  timezone={weather.timezone}
                />
              }
              forecast={
                <ForecastPanelSlot
                  hourly={weather.hourly}
                  daily={weather.daily}
                  locationId={weather.location.id}
                />
              }
              details={<WeatherDetails current={weather.current} />}
              airQuality={
                <AirQualitySlot
                  coords={coords}
                  airQuality={weather.airQuality}
                />
              }
              uv={
                <UVIndexSlot
                  coords={coords}
                  airQuality={weather.airQuality}
                  fallbackUv={
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
                  <WeatherMap location={weather.location} />
                )
              }
            />
          </DaySelectionProvider>
        </CityCrossfade>
      ) : (
        <div className="min-h-0 w-full flex-1 overflow-hidden">
          <DashboardSkeleton />
        </div>
      )}
    </AppShell>
  );
}
