"use client";

import { useSettingsStore } from "@/stores/settingsStore";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

/**
 * Segmented km/h / mph control.
 */
export function SpeedUnitToggle({ className }: { className?: string }) {
  const unit = useSettingsStore((s) => s.speedUnit);
  const setUnit = useSettingsStore((s) => s.setSpeedUnit);
  const t = useT();

  return (
    <div
      role="group"
      aria-label={t("units.speed")}
      className={cn(
        "glass flex h-9 shrink-0 items-center rounded-full p-0.5 sm:h-10",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setUnit("kmh")}
        aria-pressed={unit === "kmh"}
        className={cn(
          "h-full rounded-full px-2 text-xs font-semibold tracking-wide transition-colors sm:px-2.5 sm:text-sm",
          unit === "kmh"
            ? "bg-white/20 text-[var(--text-primary)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
        )}
      >
        km/h
      </button>
      <button
        type="button"
        onClick={() => setUnit("mph")}
        aria-pressed={unit === "mph"}
        className={cn(
          "h-full rounded-full px-2 text-xs font-semibold tracking-wide transition-colors sm:px-2.5 sm:text-sm",
          unit === "mph"
            ? "bg-white/20 text-[var(--text-primary)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
        )}
      >
        mph
      </button>
    </div>
  );
}
