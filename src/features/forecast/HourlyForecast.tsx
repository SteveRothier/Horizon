"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { useLocale, useT } from "@/hooks/useT";
import { useSettingsStore } from "@/stores/settingsStore";
import type { HourlyForecastItem } from "@/types/weather";
import { formatHour } from "@/utils/format";
import { formatTemp } from "@/utils/units";
import { cn } from "@/utils/cn";

type HourlyForecastProps = {
  items: HourlyForecastItem[];
  className?: string;
};

export function HourlyForecast({ items, className }: HourlyForecastProps) {
  const t = useT();
  const locale = useLocale();
  const unit = useSettingsStore((s) => s.temperatureUnit);

  return (
    <GlassCard
      interactive={false}
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden p-[var(--card-pad)]",
        className,
      )}
    >
      <h2 className="mb-2 shrink-0 text-sm font-medium text-[var(--text-secondary)]">
        {t("forecast.hourly")}
      </h2>
      <div className="flex min-h-0 flex-1 items-stretch gap-1 overflow-x-auto scrollbar-none sm:gap-2">
        {items.slice(0, 24).map((item) => (
          <div
            key={item.time}
            className="flex w-12 shrink-0 flex-col items-center justify-center gap-1 sm:w-14"
          >
            <span className="text-[0.65rem] text-[var(--text-muted)] sm:text-xs">
              {formatHour(item.time, locale)}
            </span>
            <WeatherIcon
              condition={item.condition}
              isDay={item.isDay}
              size={22}
            />
            <span className="text-sm font-medium">
              {formatTemp(item.temperature, unit)}
            </span>
            <span className="text-[0.6rem] text-[var(--accent-cool)]">
              {Math.round(item.precipitationProbability)}%
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
