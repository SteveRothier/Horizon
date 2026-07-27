"use client";

import type { ReactNode } from "react";
import { Search, MapPin, Menu } from "lucide-react";
import { TemperatureToggle } from "@/components/ui/TemperatureToggle";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

type HeaderProps = {
  searchSlot?: ReactNode;
  geolocationSlot?: ReactNode;
  /** Extra controls after the °C/°F toggle */
  settingsSlot?: ReactNode;
  menuOpen?: boolean;
  onMenuClick?: () => void;
  className?: string;
};

export function Header({
  searchSlot,
  geolocationSlot,
  settingsSlot,
  menuOpen = false,
  onMenuClick,
  className,
}: HeaderProps) {
  const t = useT();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-[var(--header-height)] shrink-0 items-center gap-2 px-[var(--page-gutter)] sm:gap-3",
        className,
      )}
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="glass glass-sm flex h-9 w-9 items-center justify-center lg:hidden"
        aria-label={t("sidebar.openMenu")}
        aria-expanded={menuOpen}
        aria-controls="app-sidebar"
      >
        <Menu className="h-4 w-4" aria-hidden />
      </button>

      <div className="hidden items-baseline gap-2 sm:flex">
        <span className="font-[family-name:var(--font-horizon-display)] text-lg font-semibold tracking-tight text-[var(--text-primary)] xl:text-xl">
          {t("header.brand")}
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 items-center gap-2">
        {searchSlot ?? (
          <div
            className="glass glass-sm flex h-9 w-full items-center gap-2 px-3 text-[var(--text-muted)] sm:h-10 sm:gap-3 sm:px-4"
            role="search"
            aria-label={t("header.searchLabel")}
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate text-sm">
              {t("header.searchPlaceholder")}
            </span>
          </div>
        )}
        {geolocationSlot ?? (
          <button
            type="button"
            className="glass glass-sm flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10"
            aria-label={t("header.geolocate")}
            disabled
          >
            <MapPin className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <TemperatureToggle />
        {settingsSlot}
      </div>
    </header>
  );
}
