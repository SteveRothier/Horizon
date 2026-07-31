"use client";

import { useEffect, useMemo, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { useLocale, useT } from "@/hooks/useT";
import { useSettingsStore } from "@/stores/settingsStore";
import type { DailyForecastItem } from "@/types/weather";
import { formatDayShort } from "@/utils/format";
import { formatTemp } from "@/utils/units";
import {
  dashboardCardClass,
  dashboardCardTitleClass,
} from "@/constants/layout";
import { cn } from "@/utils/cn";

type WeeklyForecastProps = {
  items: DailyForecastItem[];
  selectedDate: string;
  onSelectDay: (date: string) => void;
  /** Skip GlassCard + title — for use inside ForecastPanel. */
  embedded?: boolean;
  className?: string;
};

/**
 * Day tab strip — equal-width pills under the hourly chart.
 */
export function WeeklyForecast({
  items,
  selectedDate,
  onSelectDay,
  embedded = false,
  className,
}: WeeklyForecastProps) {
  const t = useT();
  const locale = useLocale();
  const unit = useSettingsStore((s) => s.temperatureUnit);
  const days = useMemo(() => items.slice(0, 7), [items]);
  const listRef = useRef<HTMLUListElement>(null);
  const pillRefs = useRef(new Map<string, HTMLLIElement>());

  useEffect(() => {
    const pill = pillRefs.current.get(selectedDate);
    if (!pill) return;
    pill.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedDate]);

  const list = (
    <ul
      ref={listRef}
      className={cn(
        "scrollbar-none flex w-full min-w-0 gap-1 overflow-x-auto overscroll-x-contain py-0.5",
        embedded && "justify-between gap-0.5 sm:gap-1",
      )}
      role="listbox"
      aria-label={t("forecast.weekly")}
    >
      {days.map((day) => {
        const selected = day.date === selectedDate;
        const precip = Math.round(day.precipitationProbability);

        return (
          <li
            key={day.date}
            ref={(node) => {
              if (node) pillRefs.current.set(day.date, node);
              else pillRefs.current.delete(day.date);
            }}
            className={cn("shrink-0", embedded && "min-w-0 flex-1")}
          >
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelectDay(day.date)}
              className={cn(
                "box-border flex h-full w-full min-w-[2.75rem] flex-col items-center justify-center gap-0.5 rounded-[var(--glass-radius-sm)] px-0.5 py-1.5 transition-colors duration-200 sm:min-w-0 sm:px-1",
                selected
                  ? "bg-white/15 text-[var(--text-primary)] ring-1 ring-inset ring-white/25"
                  : "text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]",
              )}
            >
              <span className="flex w-full items-baseline justify-between gap-0.5 px-0.5 text-[0.6rem] font-medium leading-none sm:text-[0.65rem]">
                <span className="tabular-nums text-[var(--text-primary)]">
                  {parseInt(day.date.slice(8, 10), 10)}
                </span>
                <span className="truncate text-[var(--text-muted)]">
                  {formatDayShort(day.date, locale)}
                </span>
              </span>
              <WeatherIcon condition={day.condition} isDay size={18} />
              <span className="flex items-baseline gap-0.5 tabular-nums leading-none">
                <span className="text-[0.7rem] font-semibold sm:text-xs">
                  {formatTemp(day.temperatureMax, unit)}
                </span>
                <span className="text-[0.55rem] text-[var(--text-muted)] sm:text-[0.6rem]">
                  {formatTemp(day.temperatureMin, unit)}
                </span>
              </span>
              <span
                className={cn(
                  "text-[0.55rem] font-medium tabular-nums leading-none sm:text-[0.6rem]",
                  precip > 0
                    ? "text-[var(--accent-cool)]"
                    : "invisible",
                )}
                aria-hidden={precip <= 0}
              >
                {precip > 0 ? `${precip}%` : "0%"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  if (embedded) {
    return (
      <div className={cn("w-full min-w-0 shrink-0", className)}>{list}</div>
    );
  }

  return (
    <GlassCard
      interactive={false}
      className={cn(dashboardCardClass, className)}
    >
      <h2 className={dashboardCardTitleClass}>{t("forecast.weekly")}</h2>
      {list}
    </GlassCard>
  );
}
