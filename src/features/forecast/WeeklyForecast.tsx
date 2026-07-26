"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { useSettingsStore } from "@/stores/settingsStore";
import type { DailyForecastItem } from "@/types/weather";
import { formatDayShort } from "@/utils/format";
import { formatTemp, toDisplayTemp } from "@/utils/units";
import { cn } from "@/utils/cn";

type WeeklyForecastProps = {
  items: DailyForecastItem[];
  className?: string;
};

export function WeeklyForecast({ items, className }: WeeklyForecastProps) {
  const unit = useSettingsStore((s) => s.temperatureUnit);
  const days = items.slice(0, 7);

  const displayTemps = days.flatMap((d) => [
    toDisplayTemp(d.temperatureMin, unit),
    toDisplayTemp(d.temperatureMax, unit),
  ]);
  const globalMin = Math.min(...displayTemps);
  const globalMax = Math.max(...displayTemps);
  const span = Math.max(globalMax - globalMin, 1);

  return (
    <GlassCard
      interactive={false}
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden p-[var(--card-pad)]",
        className,
      )}
    >
      <h2 className="mb-2 shrink-0 text-sm font-medium text-[var(--text-secondary)]">
        7 jours
      </h2>
      <ul className="flex min-h-0 flex-1 flex-col justify-between gap-0.5">
        {days.map((day) => {
          const min = toDisplayTemp(day.temperatureMin, unit);
          const max = toDisplayTemp(day.temperatureMax, unit);
          const left = ((min - globalMin) / span) * 100;
          const width = ((max - min) / span) * 100;

          return (
            <li
              key={day.date}
              className="flex min-h-0 flex-1 items-center gap-2"
            >
              <span className="w-9 shrink-0 text-xs text-[var(--text-secondary)]">
                {formatDayShort(day.date)}
              </span>
              <WeatherIcon condition={day.condition} isDay size={18} />
              <span className="w-8 shrink-0 text-right text-xs text-[var(--text-muted)]">
                {formatTemp(day.temperatureMin, unit)}
              </span>
              <div className="relative h-1.5 min-w-0 flex-1 rounded-full bg-white/10">
                <div
                  className="absolute top-0 h-full rounded-full bg-gradient-to-r from-[var(--accent-cool)] to-[var(--accent-warm)]"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(width, 4)}%`,
                  }}
                />
              </div>
              <span className="w-8 shrink-0 text-xs font-medium">
                {formatTemp(day.temperatureMax, unit)}
              </span>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
