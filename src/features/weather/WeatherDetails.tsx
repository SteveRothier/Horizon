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
import { useSettingsStore } from "@/stores/settingsStore";
import type { CurrentWeather } from "@/types/weather";
import { formatTimeShort, windDirectionLabel } from "@/utils/format";
import { formatTemp } from "@/utils/units";
import { cn } from "@/utils/cn";

type WeatherDetailsProps = {
  current: CurrentWeather;
  className?: string;
};

export function WeatherDetails({ current, className }: WeatherDetailsProps) {
  const unit = useSettingsStore((s) => s.temperatureUnit);

  const items = [
    {
      icon: Thermometer,
      label: "Ressenti",
      value: formatTemp(current.feelsLike, unit),
    },
    {
      icon: Droplets,
      label: "Humidité",
      value: `${Math.round(current.humidity)}%`,
    },
    {
      icon: Wind,
      label: "Vent",
      value: `${Math.round(current.windSpeed)} km/h ${windDirectionLabel(current.windDirection)}`,
    },
    {
      icon: Gauge,
      label: "Pression",
      value: `${Math.round(current.pressure)} hPa`,
    },
    {
      icon: Cloud,
      label: "Nuages",
      value: `${Math.round(current.cloudCover)}%`,
    },
    {
      icon: Eye,
      label: "Visibilité",
      value:
        current.visibility != null
          ? `${(current.visibility / 1000).toFixed(1)} km`
          : "—",
    },
    {
      icon: Sunrise,
      label: "Lever",
      value: formatTimeShort(current.sunrise),
    },
    {
      icon: Sunset,
      label: "Coucher",
      value: formatTimeShort(current.sunset),
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
        Détails
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
