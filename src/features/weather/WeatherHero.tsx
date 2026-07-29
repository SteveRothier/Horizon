"use client";

import { useEffect, useState } from "react";
import { Clock, Droplets, Gauge, Sun, Wind } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { ShareButton } from "@/features/weather/ShareButton";
import { useLocale, useT } from "@/hooks/useT";
import { useSettingsStore } from "@/stores/settingsStore";
import type { CurrentWeather, GeoLocation } from "@/types/weather";
import { formatLocalClock } from "@/utils/format";
import { formatSpeed, formatTemp } from "@/utils/units";
import { descriptionFromCondition } from "@/utils/weather-code";
import { cn } from "@/utils/cn";

type WeatherHeroProps = {
  location: GeoLocation;
  current: CurrentWeather;
  timezone?: string;
  className?: string;
};

export function WeatherHero({
  location,
  current,
  timezone,
  className,
}: WeatherHeroProps) {
  const t = useT();
  const locale = useLocale();
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);
  const speedUnit = useSettingsStore((s) => s.speedUnit);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [timezone, location.id]);

  const localTime = formatLocalClock(timezone, locale, now);

  const description = descriptionFromCondition(
    current.condition,
    current.isDay,
    undefined,
    locale,
  );

  const metrics = [
    {
      icon: Clock,
      label: t("hero.localTime"),
      value: localTime,
    },
    {
      icon: Wind,
      label: t("hero.wind"),
      value: formatSpeed(current.windSpeed, speedUnit),
    },
    {
      icon: Droplets,
      label: t("hero.humidity"),
      value: `${Math.round(current.humidity)}%`,
    },
    {
      icon: Gauge,
      label: t("hero.pressure"),
      value: `${Math.round(current.pressure)} hPa`,
    },
    {
      icon: Sun,
      label: t("hero.uv"),
      value:
        current.uvIndex != null ? String(Math.round(current.uvIndex)) : "—",
    },
  ];

  return (
    <GlassCard
      interactive={false}
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden p-[var(--card-pad)]",
        className,
      )}
    >
      <div className="absolute top-[var(--card-pad)] right-[var(--card-pad)] z-10 flex items-center gap-1">
        <ShareButton className="h-8 w-8" />
        <FavoriteButton location={location} className="h-8 w-8" />
      </div>

      <div className="flex min-h-0 flex-1 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div>
            <p className="truncate pr-20 text-xs text-[var(--text-muted)] sm:text-sm">
              {location.displayName}
            </p>
            <p className="mt-1 font-[family-name:var(--font-horizon-display)] text-5xl font-light leading-none tracking-tight sm:text-6xl xl:text-7xl">
              {formatTemp(current.temperature, temperatureUnit)}
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)] sm:text-base">
              {description}
            </p>
            <p className="text-xs text-[var(--text-secondary)] sm:text-sm">
              {t("hero.feelsLike")}{" "}
              {formatTemp(current.feelsLike, temperatureUnit)}
            </p>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3">
            {metrics.map(({ icon: Icon, label, value }) => (
              <div key={label} className="min-w-0">
                <div className="flex items-center gap-1 text-[0.65rem] text-[var(--text-muted)] sm:text-xs">
                  <Icon className="h-3 w-3 shrink-0" aria-hidden />
                  {label}
                </div>
                <p className="truncate text-sm font-medium sm:text-base">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <WeatherIcon
          condition={current.condition}
          isDay={current.isDay}
          size={64}
          className="mt-8 shrink-0 sm:mt-10 sm:h-20 sm:w-20 xl:h-24 xl:w-24"
        />
      </div>
    </GlassCard>
  );
}
