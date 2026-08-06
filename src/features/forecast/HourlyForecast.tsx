"use client";

import dynamic from "next/dynamic";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  dateKeyFromTime,
  filterHourlyByDate,
} from "@/features/forecast/filterHourlyByDate";
import { useLocale, useT } from "@/hooks/useT";
import type { HourlyForecastItem } from "@/types/weather";
import { formatDayShort } from "@/utils/format";
import {
  dashboardCardClass,
  dashboardCardTitleClass,
} from "@/constants/layout";
import { cn } from "@/utils/cn";

const HourlyCombinedChart = dynamic(
  () =>
    import("@/features/forecast/charts/HourlyCombinedChart").then(
      (m) => m.HourlyCombinedChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full min-h-0 w-full flex-1 flex-col gap-1.5"
        aria-hidden
      >
        <Skeleton className="min-h-0 flex-1 w-full rounded-[var(--glass-radius-sm)]" />
        <div className="flex shrink-0 gap-3 overflow-hidden px-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-5 shrink-0 rounded-full" />
          ))}
        </div>
      </div>
    ),
  },
);

type HourlyForecastProps = {
  /** Full multi-day hourly series. */
  hourly: HourlyForecastItem[];
  /** Ordered day keys (YYYY-MM-DD), usually from daily forecast. */
  dates: string[];
  /** Selected day key. */
  dateKey: string;
  /** Today’s date key — past hours trimmed for that day. */
  todayDate?: string;
  /** Reset strip without animation when the city changes. */
  locationId?: string;
  /** Sync weekly selection when the visible day changes via scroll. */
  onDayChange?: (date: string) => void;
  /** Skip GlassCard + title — for use inside ForecastPanel. */
  embedded?: boolean;
  /** External day label node (ForecastPanel title). */
  dayLabelRef?: RefObject<HTMLSpanElement | null>;
  className?: string;
};

function durationMsForDistance(cols: number): number {
  if (cols <= 0) return 0;
  const steps = Math.max(1, Math.round(cols / 24));
  return Math.min(950, 340 + (steps - 1) * 160);
}

/**
 * One continuous multi-day chart (Google Weather style).
 * Changing day scrolls the shared strip; scrolling updates the title day.
 */
export function HourlyForecast({
  hourly,
  dates,
  dateKey,
  todayDate,
  locationId,
  onDayChange,
  embedded = false,
  dayLabelRef: dayLabelRefProp,
  className,
}: HourlyForecastProps) {
  const t = useT();
  const locale = useLocale();

  const { continuous, dayStartIndex } = useMemo(() => {
    const continuous: HourlyForecastItem[] = [];
    const dayStartIndex = new Map<string, number>();

    for (const date of dates) {
      dayStartIndex.set(date, continuous.length);
      continuous.push(
        ...filterHourlyByDate(hourly, date, {
          fromNowIfToday: true,
          todayDate,
        }),
      );
    }

    return { continuous, dayStartIndex };
  }, [dates, hourly, todayDate]);

  const targetCol = dayStartIndex.get(dateKey) ?? 0;
  const [scrollToIndex, setScrollToIndex] = useState(targetCol);
  const [scrollDurationMs, setScrollDurationMs] = useState(0);
  const colRef = useRef(targetCol);
  /** After initial/location snap, user day changes should animate. */
  const readyRef = useRef(true);
  /** Click-driven scroll animation in progress — don't push day changes up. */
  const programmaticRef = useRef(false);
  const visibleDateRef = useRef(dateKey);
  const continuousRef = useRef(continuous);
  continuousRef.current = continuous;
  const dayStartRef = useRef(dayStartIndex);
  dayStartRef.current = dayStartIndex;
  const onDayChangeRef = useRef(onDayChange);
  onDayChangeRef.current = onDayChange;
  const parentSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dayLabelRefInternal = useRef<HTMLSpanElement>(null);
  const dayLabelRef = dayLabelRefProp ?? dayLabelRefInternal;
  const localeRef = useRef(locale);
  localeRef.current = locale;

  /** Update title day without React setState (keeps grab scroll off the React path). */
  const writeDayLabel = useCallback((date: string) => {
    const el = dayLabelRef.current;
    if (el) el.textContent = ` · ${formatDayShort(date, localeRef.current)}`;
  }, [dayLabelRef]);

  const flushParentDay = useCallback((nextDate: string) => {
    if (parentSyncTimerRef.current) {
      clearTimeout(parentSyncTimerRef.current);
      parentSyncTimerRef.current = null;
    }
    startTransition(() => {
      onDayChangeRef.current?.(nextDate);
    });
  }, []);

  const scheduleParentDay = useCallback(
    (nextDate: string) => {
      if (parentSyncTimerRef.current) {
        clearTimeout(parentSyncTimerRef.current);
      }
      parentSyncTimerRef.current = setTimeout(() => {
        parentSyncTimerRef.current = null;
        flushParentDay(nextDate);
      }, 180);
    },
    [flushParentDay],
  );

  useEffect(() => {
    return () => {
      if (parentSyncTimerRef.current) clearTimeout(parentSyncTimerRef.current);
    };
  }, []);

  useEffect(() => {
    writeDayLabel(visibleDateRef.current);
  }, [locale, writeDayLabel]);

  useEffect(() => {
    programmaticRef.current = false;
    if (parentSyncTimerRef.current) {
      clearTimeout(parentSyncTimerRef.current);
      parentSyncTimerRef.current = null;
    }
    const col = dayStartIndex.get(dateKey) ?? 0;
    colRef.current = col;
    visibleDateRef.current = dateKey;
    writeDayLabel(dateKey);
    setScrollDurationMs(0);
    setScrollToIndex(col);
    // Snap on city change is done — next day click must animate.
    readyRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  useEffect(() => {
    if (dateKey === visibleDateRef.current) {
      colRef.current = targetCol;
      return;
    }

    if (!readyRef.current) {
      readyRef.current = true;
      visibleDateRef.current = dateKey;
      colRef.current = targetCol;
      writeDayLabel(dateKey);
      setScrollDurationMs(0);
      setScrollToIndex(targetCol);
      return;
    }

    const from = colRef.current;
    const distance = Math.abs(targetCol - from);
    programmaticRef.current = true;
    if (parentSyncTimerRef.current) {
      clearTimeout(parentSyncTimerRef.current);
      parentSyncTimerRef.current = null;
    }

    if (distance === 0) {
      visibleDateRef.current = dateKey;
      writeDayLabel(dateKey);
      programmaticRef.current = false;
      return;
    }

    setScrollDurationMs(durationMsForDistance(distance));
    setScrollToIndex(targetCol);
    colRef.current = targetCol;
  }, [dateKey, targetCol, writeDayLabel]);

  const onScrollColumn = useCallback(
    (columnIndex: number) => {
      const items = continuousRef.current;
      if (items.length === 0) return;

      const item = items[Math.max(0, Math.min(items.length - 1, columnIndex))];
      const nextDate = dateKeyFromTime(item.time);
      const dayStart = dayStartRef.current.get(nextDate) ?? columnIndex;
      colRef.current = dayStart;

      if (visibleDateRef.current === nextDate) return;

      visibleDateRef.current = nextDate;
      writeDayLabel(nextDate);

      if (programmaticRef.current) return;

      scheduleParentDay(nextDate);
    },
    [scheduleParentDay, writeDayLabel],
  );

  const dateKeyRef = useRef(dateKey);
  dateKeyRef.current = dateKey;

  const onProgrammaticScrollEnd = useCallback(() => {
    programmaticRef.current = false;
    const key = dateKeyRef.current;
    if (visibleDateRef.current !== key) {
      visibleDateRef.current = key;
      writeDayLabel(key);
    }
  }, [writeDayLabel]);

  const body = (
    <div className="relative flex min-h-0 w-full min-w-0 flex-col overflow-hidden sm:min-h-0 sm:flex-1">
      {continuous.length === 0 ? (
        <p className="flex h-full min-h-0 items-center justify-center text-center text-xs text-[var(--text-muted)]">
          {t("forecast.noHourly")}
        </p>
      ) : (
        <HourlyCombinedChart
          className="sm:h-full"
          items={continuous}
          scrollToIndex={scrollToIndex}
          scrollDurationMs={scrollDurationMs}
          locationId={locationId}
          todayDate={todayDate}
          onScrollColumn={onScrollColumn}
          onProgrammaticScrollEnd={onProgrammaticScrollEnd}
        />
      )}
    </div>
  );

  if (embedded) {
    return (
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-col sm:flex-1",
          className,
        )}
      >
        {body}
      </div>
    );
  }

  return (
    <GlassCard
      interactive={false}
      className={cn(dashboardCardClass, className)}
    >
      <h2 className={dashboardCardTitleClass}>
        {t("forecast.hourly")}
        <span ref={dayLabelRefInternal} className="text-[var(--text-muted)]">
          {" "}
          · {formatDayShort(dateKey, locale)}
        </span>
      </h2>
      {body}
    </GlassCard>
  );
}
