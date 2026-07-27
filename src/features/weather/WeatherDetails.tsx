"use client";

import {
  Cloud,
  Droplets,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useLocale, useT } from "@/hooks/useT";
import { useSettingsStore } from "@/stores/settingsStore";
import type { CurrentWeather } from "@/types/weather";
import { formatTimeShort, windDirectionLabel } from "@/utils/format";
import { formatSpeed, formatTemp, formatVisibility } from "@/utils/units";
import { cn } from "@/utils/cn";

type WeatherDetailsProps = {
  current: CurrentWeather;
  className?: string;
};

export function WeatherDetails({ current, className }: WeatherDetailsProps) {
  const t = useT();
  const locale = useLocale();
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);
  const speedUnit = useSettingsStore((s) => s.speedUnit);

  const items = [
    {
      icon: Thermometer,
      label: t("details.feelsLike"),
      value: formatTemp(current.feelsLike, temperatureUnit),
    },
    {
      icon: Droplets,
      label: t("details.humidity"),
      value: `${Math.round(current.humidity)}%`,
    },
    {
      icon: Wind,
      label: t("details.wind"),
      value: `${formatSpeed(current.windSpeed, speedUnit)} ${windDirectionLabel(current.windDirection, locale)}`,
    },
    {
      icon: Gauge,
      label: t("details.pressure"),
      value: `${Math.round(current.pressure)} hPa`,
    },
    {
      icon: Cloud,
      label: t("details.clouds"),
      value: `${Math.round(current.cloudCover)}%`,
    },
    {
      icon: Eye,
      label: t("details.visibility"),
      value: formatVisibility(current.visibility, speedUnit),
    },
    {
      icon: Sunrise,
      label: t("details.sunrise"),
      value: formatTimeShort(current.sunrise, locale),
    },
    {
      icon: Sunset,
      label: t("details.sunset"),
      value: formatTimeShort(current.sunset, locale),
    },
  ];

  return (
    <GlassCard
      interactive={false}
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden p-[var(--card-pad)]",
        className,
      )}
    >
      <h2 className="mb-2 shrink-0 text-sm font-medium text-[var(--text-secondary)]">
        {t("details.title")}
      </h2>
      <div className="grid min-h-0 flex-1 grid-cols-2 content-center gap-x-3 gap-y-2 overflow-auto scrollbar-none">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="min-w-0">
            <div className="flex items-center gap-1 text-[0.65rem] text-[var(--text-muted)]">
              <Icon className="h-3 w-3 shrink-0" aria-hidden />
              {label}
            </div>
            <p className="truncate text-sm font-medium">{value}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
