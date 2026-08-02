"use client";

import { memo } from "react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { GaugeSkeleton } from "@/components/ui/skeletons";
import { AirQuality } from "@/features/weather/AirQuality";
import { UVIndex } from "@/features/weather/UVIndex";
import { useT } from "@/hooks/useT";
import { useAirQuality } from "@/hooks/useWeather";
import { messageFromApiError } from "@/utils/api-error";

type Coords = { lat: number; lon: number };

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
