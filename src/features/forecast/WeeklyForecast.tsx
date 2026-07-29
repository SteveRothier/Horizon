"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { useLocale, useT } from "@/hooks/useT";
import { useSettingsStore } from "@/stores/settingsStore";
import type { DailyForecastItem } from "@/types/weather";
import { formatDayShort } from "@/utils/format";
import { formatTemp, toDisplayTemp } from "@/utils/units";
import { cn } from "@/utils/cn";

type WeeklyForecastProps = {
  items: DailyForecastItem[];
  selectedDate: string;
  onSelectDay: (date: string) => void;
  className?: string;
};

type HighlightBox = { top: number; height: number };

export function WeeklyForecast({
  items,
  selectedDate,
  onSelectDay,
  className,
}: WeeklyForecastProps) {
  const t = useT();
  const locale = useLocale();
  const unit = useSettingsStore((s) => s.temperatureUnit);
  const days = useMemo(() => items.slice(0, 7), [items]);
  const daysKey = useMemo(() => days.map((d) => d.date).join("|"), [days]);

  const listRef = useRef<HTMLUListElement>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const [highlight, setHighlight] = useState<HighlightBox | null>(null);
  const [canAnimate, setCanAnimate] = useState(false);

  const measureHighlight = useCallback(() => {
    const row = rowRefs.current.get(selectedDate);
    if (!row) return;

    const next = {
      top: row.offsetTop,
      height: row.offsetHeight,
    };

    setHighlight((prev) => {
      if (
        prev &&
        Math.abs(prev.top - next.top) < 0.5 &&
        Math.abs(prev.height - next.height) < 0.5
      ) {
        return prev;
      }
      return next;
    });
  }, [selectedDate]);

  useLayoutEffect(() => {
    measureHighlight();
    // Enable transitions after the first paint so the pill doesn't slide in on mount.
    const id = requestAnimationFrame(() => setCanAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [measureHighlight, daysKey]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => measureHighlight());
    ro.observe(list);
    for (const row of rowRefs.current.values()) ro.observe(row);
    return () => ro.disconnect();
  }, [measureHighlight, daysKey]);

  const setRowRef = useCallback((date: string, node: HTMLLIElement | null) => {
    if (node) rowRefs.current.set(date, node);
    else rowRefs.current.delete(date);
  }, []);

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
        {t("forecast.weekly")}
      </h2>
      <ul
        ref={listRef}
        className="relative flex min-h-0 flex-1 flex-col justify-between gap-0.5"
        role="listbox"
        aria-label={t("forecast.weekly")}
      >
        {highlight ? (
          <div
            aria-hidden
            className={cn(
              "weekly-day-highlight pointer-events-none absolute top-0 right-0 left-0 z-0 rounded-[var(--glass-radius-sm)] bg-white/12",
              canAnimate && "is-ready",
            )}
            style={{
              height: highlight.height,
              transform: `translate3d(0, ${highlight.top}px, 0)`,
            }}
          />
        ) : null}

        {days.map((day) => {
          const min = toDisplayTemp(day.temperatureMin, unit);
          const max = toDisplayTemp(day.temperatureMax, unit);
          const left = ((min - globalMin) / span) * 100;
          const width = ((max - min) / span) * 100;
          const selected = day.date === selectedDate;
          const precip = Math.round(day.precipitationProbability);

          return (
            <li
              key={day.date}
              ref={(node) => setRowRef(day.date, node)}
              className="relative z-[1] min-h-0 flex-1"
            >
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelectDay(day.date)}
                className={cn(
                  "flex h-full w-full min-h-0 items-center gap-1.5 rounded-[var(--glass-radius-sm)] py-0.5 pr-1 pl-2 text-left transition-colors duration-200",
                  selected
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-white/8",
                )}
              >
                <span className="w-9 shrink-0 text-xs">
                  {formatDayShort(day.date, locale)}
                </span>
                <WeatherIcon condition={day.condition} isDay size={18} />
                <span
                  className={cn(
                    "w-7 shrink-0 text-right text-[0.65rem] font-medium tabular-nums sm:text-xs",
                    precip > 0
                      ? "text-[var(--accent-cool)]"
                      : "text-[var(--text-muted)] opacity-40",
                  )}
                >
                  {precip > 0 ? `${precip}%` : "—"}
                </span>
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
              </button>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
