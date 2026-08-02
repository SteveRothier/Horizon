"use client";

import { memo, useMemo } from "react";
import { useDaySelection } from "@/features/forecast/DaySelectionContext";
import { ForecastPanel } from "@/features/forecast/ForecastPanel";
import type { DailyForecastItem, HourlyForecastItem } from "@/types/weather";

type ForecastPanelSlotProps = {
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  locationId: string;
};

export const ForecastPanelSlot = memo(function ForecastPanelSlot({
  hourly,
  daily,
  locationId,
}: ForecastPanelSlotProps) {
  const { activeDate, todayDate, setSelectedDate } = useDaySelection();
  const dates = useMemo(
    () => daily.slice(0, 7).map((d) => d.date),
    [daily],
  );

  return (
    <ForecastPanel
      hourly={hourly}
      daily={daily}
      dates={dates}
      dateKey={activeDate ?? dates[0] ?? "day"}
      todayDate={todayDate ?? undefined}
      locationId={locationId}
      onDayChange={setSelectedDate}
    />
  );
});
