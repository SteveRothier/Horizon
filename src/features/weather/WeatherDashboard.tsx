"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import {
  DashboardSkeleton,
  GaugeSkeleton,
  MapSkeleton,
} from "@/components/ui/skeletons";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { SpeedUnitToggle } from "@/components/ui/SpeedUnitToggle";
import { SearchBar } from "@/features/header/SearchBar";
import { GeolocationButton } from "@/features/header/GeolocationButton";
import { FavoritesList } from "@/features/favorites/FavoritesList";
import { HistoryList } from "@/features/history/HistoryList";
import { HourlyForecast } from "@/features/forecast/HourlyForecast";
import { WeeklyForecast } from "@/features/forecast/WeeklyForecast";
import { WeatherMap } from "@/features/map/WeatherMap";
import { AirQuality } from "@/features/weather/AirQuality";
import { UVIndex } from "@/features/weather/UVIndex";
import { WeatherDetails } from "@/features/weather/WeatherDetails";
import { WeatherHero } from "@/features/weather/WeatherHero";
import { useT } from "@/hooks/useT";
import { useAirQuality, useWeather } from "@/hooks/useWeather";
import { clientFetchJson } from "@/services/client-api";
import { useLocationStore } from "@/stores/locationStore";
import type { DayPeriod, GeoLocation } from "@/types/weather";
import { messageFromApiError } from "@/utils/api-error";
import { queryFromSlug, toCityPath } from "@/utils/city-url";
import { selectLocation } from "@/utils/selectLocation";
import { slugifyCity } from "@/utils/weather-code";

type GeocodeSearchResponse = { results: GeoLocation[] };

type WeatherDashboardProps = {
  citySlug?: string;
};

export function WeatherDashboard({ citySlug }: WeatherDashboardProps) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const location = useLocationStore((s) => s.location);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [slugResolving, setSlugResolving] = useState(Boolean(citySlug));
  const resolvingSlug = useRef<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Resolve /weather/[city] into the location store when the slug differs.
  useEffect(() => {
    if (!hydrated || !citySlug) {
      setSlugResolving(false);
      return;
    }

    const currentSlug = slugifyCity(location.name);
    if (currentSlug === citySlug) {
      setSlugError(null);
      setSlugResolving(false);
      return;
    }

    if (resolvingSlug.current === citySlug) return;
    resolvingSlug.current = citySlug;
    let cancelled = false;

    setSlugResolving(true);
    setSlugError(null);
    (async () => {
      try {
        const data = await clientFetchJson<GeocodeSearchResponse>(
          `/api/geocode?q=${encodeURIComponent(queryFromSlug(citySlug))}`,
        );
        if (cancelled) return;
        const match = data.results[0];
        if (match) {
          selectLocation(match);
          setSlugError(null);
        } else {
          setSlugError(t("error.slugNotFound"));
        }
      } catch (err) {
        if (!cancelled) {
          setSlugError(messageFromApiError(err, t, "error.slugNotFound"));
        }
      } finally {
        if (!cancelled) setSlugResolving(false);
        if (resolvingSlug.current === citySlug) resolvingSlug.current = null;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, citySlug, location.name, t]);

  // Keep the shareable SEO URL in sync with the selected city.
  useEffect(() => {
    if (!hydrated || slugResolving) return;
    const path = toCityPath(location);
    if (pathname !== path) {
      router.replace(path);
    }
  }, [hydrated, slugResolving, location, pathname, router]);

  const coords =
    hydrated && !slugResolving
      ? { lat: location.latitude, lon: location.longitude }
      : null;

  const weatherQuery = useWeather(coords);
  const airQuery = useAirQuality(coords);

  const weather = weatherQuery.data;
  const period: DayPeriod = weather?.current.isDay ? "day" : "night";
  const condition = weather?.current.condition ?? "clear";

  const isLoading = !hydrated || slugResolving || weatherQuery.isLoading;
  const isError = weatherQuery.isError;

  return (
    <AppShell
      weather={condition}
      period={period}
      searchSlot={<SearchBar />}
      geolocationSlot={
        <GeolocationButton onError={(message) => setGeoError(message)} />
      }
      settingsSlot={
        <>
          <SpeedUnitToggle className="hidden sm:flex" />
          <LocaleToggle className="hidden md:flex" />
        </>
      }
      favoritesSlot={<FavoritesList />}
      historySlot={<HistoryList />}
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
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorCard
          message={messageFromApiError(weatherQuery.error, t)}
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
              <GaugeSkeleton label={t("aqi.title")} />
            ) : airQuery.isError ? (
              <ErrorCard
                message={messageFromApiError(airQuery.error, t)}
                onRetry={() => airQuery.refetch()}
              />
            ) : airQuery.data ? (
              <AirQuality data={airQuery.data} />
            ) : (
              <GaugeSkeleton label={t("aqi.title")} />
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
              <WeatherMap location={weather.location} />
            )
          }
        />
      ) : (
        <DashboardSkeleton />
      )}
    </AppShell>
  );
}
