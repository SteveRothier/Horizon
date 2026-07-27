"use client";

import { useSettingsStore } from "@/stores/settingsStore";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

/**
 * Segmented °C / °F control for the header.
 */
export function TemperatureToggle({ className }: { className?: string }) {
  const unit = useSettingsStore((s) => s.temperatureUnit);
  const setUnit = useSettingsStore((s) => s.setTemperatureUnit);
  const t = useT();

  return (
    <div
      role="group"
      aria-label={t("units.temp")}
      className={cn(
        "glass flex h-9 shrink-0 items-center rounded-full p-0.5 sm:h-10",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setUnit("celsius")}
        aria-pressed={unit === "celsius"}
        className={cn(
          "h-full rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors sm:px-3 sm:text-sm",
          unit === "celsius"
            ? "bg-white/20 text-[var(--text-primary)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
        )}
      >
        °C
      </button>
      <button
        type="button"
        onClick={() => setUnit("fahrenheit")}
        aria-pressed={unit === "fahrenheit"}
        className={cn(
          "h-full rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors sm:px-3 sm:text-sm",
          unit === "fahrenheit"
            ? "bg-white/20 text-[var(--text-primary)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
        )}
      >
        °F
      </button>
    </div>
  );
}
