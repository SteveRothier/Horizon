"use client";

import { Droplets, Eye, Gauge, Wind } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { useSettingsStore } from "@/stores/settingsStore";
import type { CurrentWeather, GeoLocation } from "@/types/weather";
import { formatTemp } from "@/utils/units";
import { cn } from "@/utils/cn";

type WeatherHeroProps = {
  location: GeoLocation;
  current: CurrentWeather;
  className?: string;
};

export function WeatherHero({ location, current, className }: WeatherHeroProps) {
  const unit = useSettingsStore((s) => s.temperatureUnit);

  const metrics = [
    {
      icon: Wind,
      label: "Vent",
      value: `${Math.round(current.windSpeed)} km/h`,
    },
    {
      icon: Droplets,
      label: "Humidité",
      value: `${Math.round(current.humidity)}%`,
    },
    {
      icon: Gauge,
      label: "Pression",
      value: `${Math.round(current.pressure)} hPa`,
    },
    {
      icon: Eye,
      label: "UV",
      value:
        current.uvIndex != null ? String(Math.round(current.uvIndex)) : "—",
    },
  ];

  return (
    <GlassCard
      interactive={false}
      className={cn(
        "flex h-full min-h-0 flex-col justify-between overflow-hidden p-[var(--card-pad)]",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-[var(--text-muted)] sm:text-sm">
            {location.displayName}
          </p>
          <p className="mt-1 font-[family-name:var(--font-horizon-display)] text-5xl font-light leading-none tracking-tight sm:text-6xl xl:text-7xl">
            {formatTemp(current.temperature, unit)}
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--text-primary)] sm:text-base">
            {current.description}
          </p>
          <p className="text-xs text-[var(--text-secondary)] sm:text-sm">
            Ressenti {formatTemp(current.feelsLike, unit)}
          </p>
        </div>
        <WeatherIcon
          condition={current.condition}
          isDay={current.isDay}
          size={72}
          className="sm:h-20 sm:w-20 xl:h-24 xl:w-24"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {metrics.map(({ icon: Icon, label, value }) => (
          <div key={label} className="min-w-0">
            <div className="flex items-center gap-1 text-[0.65rem] text-[var(--text-muted)] sm:text-xs">
              <Icon className="h-3 w-3 shrink-0" aria-hidden />
              {label}
            </div>
            <p className="truncate text-sm font-medium sm:text-base">{value}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
