"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { HourlyCombinedChart } from "@/features/forecast/charts/HourlyCombinedChart";
import { useT } from "@/hooks/useT";
import type { HourlyForecastItem } from "@/types/weather";
import { cn } from "@/utils/cn";

type HourlyForecastProps = {
  items: HourlyForecastItem[];
  className?: string;
};

export function HourlyForecast({ items, className }: HourlyForecastProps) {
  const t = useT();

  return (
    <GlassCard
      interactive={false}
      className={cn(
        "flex h-full min-h-0 flex-col overflow-visible p-[var(--card-pad)]",
        className,
      )}
    >
      <h2 className="mb-1.5 shrink-0 text-sm font-medium text-[var(--text-secondary)]">
        {t("forecast.hourly")}
      </h2>
      <HourlyCombinedChart items={items} />
    </GlassCard>
  );
}
