"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { SemiGauge } from "@/components/ui/SemiGauge";
import { useLocale, useT } from "@/hooks/useT";
import type { AirQualityData } from "@/types/weather";
import { aqiLabelFromIndex } from "@/utils/weather-code";
import {
  dashboardCardClass,
  dashboardCardTitleClass,
} from "@/constants/layout";
import { cn } from "@/utils/cn";

type AirQualityProps = {
  data: AirQualityData;
  className?: string;
};

function pollutant(label: string, value: number | null, unit = "µg/m³") {
  return (
    <div className="min-w-0">
      <p className="text-[0.65rem] text-[var(--text-muted)]">{label}</p>
      <p className="text-xs font-medium whitespace-nowrap">
        {value != null ? `${Math.round(value)} ${unit}` : "—"}
      </p>
    </div>
  );
}

export function AirQuality({ data, className }: AirQualityProps) {
  const t = useT();
  const locale = useLocale();
  const aqi = data.aqi ?? 0;
  const label = aqiLabelFromIndex(data.aqi, locale);
  const color =
    aqi <= 40
      ? "#7ddea2"
      : aqi <= 60
        ? "#f5c542"
        : aqi <= 80
          ? "#ff9a4a"
          : "#f07178";

  return (
    <GlassCard
      interactive={false}
      className={cn("@container", dashboardCardClass, "h-full", className)}
    >
      <h2 className={dashboardCardTitleClass}>
        {t("aqi.title")}
      </h2>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 @[15rem]:flex-row @[15rem]:gap-3">
        <SemiGauge
          value={aqi}
          max={100}
          label={label}
          color={color}
          className="w-28 shrink-0 sm:w-32"
        />
        <div className="grid w-full grid-cols-2 gap-x-3 gap-y-1.5 @[15rem]:flex-1">
          {pollutant("PM2.5", data.pm25)}
          {pollutant("PM10", data.pm10)}
          {pollutant("O₃", data.o3)}
          {pollutant("NO₂", data.no2)}
        </div>
      </div>
    </GlassCard>
  );
}