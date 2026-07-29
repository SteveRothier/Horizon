"use client";

import { memo, useMemo } from "react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { GaugeSkeleton } from "@/components/ui/skeletons";
import { useDaySelection } from "@/features/forecast/DaySelectionContext";
import { HourlyForecast } from "@/features/forecast/HourlyForecast";
import { WeeklyForecast } from "@/features/forecast/WeeklyForecast";
import { AirQuality } from "@/features/weather/AirQuality";
import { UVIndex } from "@/features/weather/UVIndex";
import { useT } from "@/hooks/useT";
import { useAirQuality } from "@/hooks/useWeather";
import type { DailyForecastItem, HourlyForecastItem } from "@/types/weather";
import { messageFromApiError } from "@/utils/api-error";

type Coords = { lat: number; lon: number };

type HourlyForecastSlotProps = {
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  locationId: string;
};

export const HourlyForecastSlot = memo(function HourlyForecastSlot({
  hourly,
  daily,
  locationId,
}: HourlyForecastSlotProps) {
  const { activeDate, todayDate, setSelectedDate } = useDaySelection();
  const dates = useMemo(
    () => daily.slice(0, 7).map((d) => d.date),
    [daily],
  );

  return (
    <HourlyForecast
      hourly={hourly}
      dates={dates}
      dateKey={activeDate ?? dates[0] ?? "day"}
      todayDate={todayDate ?? undefined}
      locationId={locationId}
      onDayChange={setSelectedDate}
    />
  );
});

type WeeklyForecastSlotProps = {
  daily: DailyForecastItem[];
};

export const WeeklyForecastSlot = memo(function WeeklyForecastSlot({
  daily,
}: WeeklyForecastSlotProps) {
  const { activeDate, setSelectedDate } = useDaySelection();

  return (
    <WeeklyForecast
      items={daily}
      selectedDate={activeDate ?? daily[0]?.date ?? ""}
      onSelectDay={setSelectedDate}
    />
  );
});

type AirQualitySlotProps = {
  coords: Coords;
};

export const AirQualitySlot = memo(function AirQualitySlot({
  coords,
}: AirQualitySlotProps) {
  const t = useT();
  const airQuery = useAirQuality(coords);

  if (airQuery.isLoading) {
    return <GaugeSkeleton label={t("aqi.title")} />;
  }
  if (airQuery.isError) {
    return (
      <ErrorCard
        message={messageFromApiError(airQuery.error, t)}
        onRetry={() => airQuery.refetch()}
      />
    );
  }
  if (airQuery.data) {
    return <AirQuality data={airQuery.data} />;
  }
  return <GaugeSkeleton label={t("aqi.title")} />;
});

type UVIndexSlotProps = {
  coords: Coords;
  fallbackUv: number | null;
};

export const UVIndexSlot = memo(function UVIndexSlot({
  coords,
  fallbackUv,
}: UVIndexSlotProps) {
  const airQuery = useAirQuality(coords);
  const value = airQuery.data?.uvIndex ?? fallbackUv;

  return <UVIndex value={value} />;
});
