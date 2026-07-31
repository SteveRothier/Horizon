"use client";

import { memo, useMemo } from "react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { GaugeSkeleton } from "@/components/ui/skeletons";
import { useDaySelection } from "@/features/forecast/DaySelectionContext";
import { ForecastPanel } from "@/features/forecast/ForecastPanel";
import { AirQuality } from "@/features/weather/AirQuality";
import { UVIndex } from "@/features/weather/UVIndex";
import { useT } from "@/hooks/useT";
import { useAirQuality } from "@/hooks/useWeather";
import type { DailyForecastItem, HourlyForecastItem } from "@/types/weather";
import { messageFromApiError } from "@/utils/api-error";

type Coords = { lat: number; lon: number };

type ForecastPanelSlotProps = {
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  locationId: string;
};

export const ForecastPanelSlot = memo(function ForecastPanelSlot({
  hourly,
  daily,
  locationId,
}: ForecastPanelSlotProps) {
  const { activeDate, todayDate, setSelectedDate } = useDaySelection();
  const dates = useMemo(
    () => daily.slice(0, 7).map((d) => d.date),
    [daily],
  );

  return (
    <ForecastPanel
      hourly={hourly}
      daily={daily}
      dates={dates}
      dateKey={activeDate ?? dates[0] ?? "day"}
      todayDate={todayDate ?? undefined}
      locationId={locationId}
      onDayChange={setSelectedDate}
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
