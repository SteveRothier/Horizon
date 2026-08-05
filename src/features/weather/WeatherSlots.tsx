"use client";

import { memo } from "react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { GaugeSkeleton } from "@/components/ui/skeletons";
import { AirQuality } from "@/features/weather/AirQuality";
import { UVIndex } from "@/features/weather/UVIndex";
import { useT } from "@/hooks/useT";
import { useAirQuality } from "@/hooks/useWeather";
import type { AirQualityData } from "@/types/weather";
import { messageFromApiError } from "@/utils/api-error";

type Coords = { lat: number; lon: number };

type AirQualitySlotProps = {
  coords: Coords;
  /** Primary path — from weather bundle. Fallback fetch only if absent. */
  airQuality?: AirQualityData | null;
};

export const AirQualitySlot = memo(function AirQualitySlot({
  coords,
  airQuality,
}: AirQualitySlotProps) {
  const t = useT();
  const needFallback = airQuality == null;
  const airQuery = useAirQuality(coords, needFallback);

  if (!needFallback && airQuality) {
    return <AirQuality data={airQuality} />;
  }

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
  airQuality?: AirQualityData | null;
  fallbackUv: number | null;
};

export const UVIndexSlot = memo(function UVIndexSlot({
  coords,
  airQuality,
  fallbackUv,
}: UVIndexSlotProps) {
  const needFallback = airQuality == null;
  const airQuery = useAirQuality(coords, needFallback);
  const value = airQuality?.uvIndex ?? airQuery.data?.uvIndex ?? fallbackUv;

  return <UVIndex value={value} />;
});
