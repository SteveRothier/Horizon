"use client";

import { useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { HourlyForecast } from "@/features/forecast/HourlyForecast";
import { WeeklyForecast } from "@/features/forecast/WeeklyForecast";
import { useLocale, useT } from "@/hooks/useT";
import type { DailyForecastItem, HourlyForecastItem } from "@/types/weather";
import { formatDayShort } from "@/utils/format";
import {
  dashboardCardClass,
  dashboardCardTitleClass,
} from "@/constants/layout";
import { cn } from "@/utils/cn";

type ForecastPanelProps = {
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  dates: string[];
  dateKey: string;
  todayDate?: string;
  locationId?: string;
  onDayChange: (date: string) => void;
  className?: string;
};

/**
 * Unified forecast card — tall hourly chart + day pills as a bottom tab strip.
 */
export function ForecastPanel({
  hourly,
  daily,
  dates,
  dateKey,
  todayDate,
  locationId,
  onDayChange,
  className,
}: ForecastPanelProps) {
  const t = useT();
  const locale = useLocale();
  const dayLabelRef = useRef<HTMLSpanElement>(null);

  return (
    <GlassCard
      interactive={false}
      className={cn(dashboardCardClass, className)}
    >
      <h2
        className={cn(
          dashboardCardTitleClass,
          "mb-0.5 truncate whitespace-nowrap sm:mb-1",
        )}
      >
        {t("forecast.title")}
        <span ref={dayLabelRef} className="text-[var(--text-muted)]">
          {" "}
          · {formatDayShort(dateKey, locale)}
        </span>
      </h2>

      <div className="flex min-h-0 min-w-0 flex-col gap-1 sm:flex-1">
        <section
          className="flex min-h-0 min-w-0 flex-col sm:flex-[1_1_0%]"
          aria-label={t("forecast.hourly")}
        >
          <HourlyForecast
            embedded
            hourly={hourly}
            dates={dates}
            dateKey={dateKey}
            todayDate={todayDate}
            locationId={locationId}
            onDayChange={onDayChange}
            dayLabelRef={dayLabelRef}
          />
        </section>

        <section
          className="w-full min-w-0 shrink-0 sm:min-h-[5rem] sm:flex-[0.32_1_0%]"
          aria-label={t("forecast.weekly")}
        >
          <WeeklyForecast
            embedded
            items={daily}
            selectedDate={dateKey}
            onSelectDay={onDayChange}
          />
        </section>
      </div>
    </GlassCard>
  );
}
