"use client";

import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { SpeedUnitToggle } from "@/components/ui/SpeedUnitToggle";
import { TemperatureToggle } from "@/components/ui/TemperatureToggle";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

type SettingsPanelProps = {
  className?: string;
};

export function SettingsPanel({ className }: SettingsPanelProps) {
  const t = useT();

  return (
    <div className={cn("space-y-3 px-1.5 py-1", className)}>
      <div className="space-y-1.5">
        <p className="px-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {t("units.temp")}
        </p>
        <TemperatureToggle className="h-9 w-full justify-stretch sm:h-9 [&>button]:flex-1" />
      </div>
      <div className="space-y-1.5">
        <p className="px-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {t("units.speed")}
        </p>
        <SpeedUnitToggle className="h-9 w-full justify-stretch sm:h-9 [&>button]:flex-1" />
      </div>
      <div className="space-y-1.5">
        <p className="px-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {t("units.locale")}
        </p>
        <LocaleToggle className="h-9 w-full justify-stretch sm:h-9 [&>button]:flex-1" />
      </div>
    </div>
  );
}
