"use client";

import type { ReactNode } from "react";
import { Search, MapPin, Menu, Star, Clock } from "lucide-react";
import { useT } from "@/hooks/useT";
import type { CollectionsView } from "@/components/layout/CollectionsPanel";
import { cn } from "@/utils/cn";

type HeaderProps = {
  searchSlot?: ReactNode;
  geolocationSlot?: ReactNode;
  menuOpen?: boolean;
  onMenuClick?: () => void;
  onOpenCollections?: (
    view: CollectionsView,
    target?: EventTarget | null,
  ) => void;
  className?: string;
};

export function Header({
  searchSlot,
  geolocationSlot,
  menuOpen = false,
  onMenuClick,
  onOpenCollections,
  className,
}: HeaderProps) {
  const t = useT();

  return (
    <header className={cn("sticky top-0 z-40 w-full min-w-0 shrink-0", className)}>
      <div className="mx-auto flex h-[var(--header-height)] w-full min-w-0 max-w-[1440px] items-center">
        {/* Same width as sidebar — keeps search aligned with dashboard cards */}
        <div className="hidden w-[var(--sidebar-width)] shrink-0 items-center px-[var(--page-gutter)] lg:flex">
          <span className="font-[family-name:var(--font-horizon-display)] text-lg font-semibold tracking-tight text-[var(--text-primary)] xl:text-xl">
            {t("header.brand")}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 px-[var(--page-gutter)] sm:gap-3 lg:pl-3">
          <div className="flex w-9 shrink-0 justify-center lg:hidden">
            <button
              type="button"
              onClick={onMenuClick}
              className="glass glass-sm flex h-9 w-9 items-center justify-center"
              aria-label={t("sidebar.openMenu")}
              aria-expanded={menuOpen}
              aria-controls="app-sidebar"
            >
              <Menu className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="min-w-0 flex-1">
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
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              data-collections-trigger=""
              onClick={(e) =>
                onOpenCollections?.("favorites", e.currentTarget)
              }
              className="glass glass-sm flex h-9 w-9 items-center justify-center"
              aria-label={t("collections.openFavorites")}
              aria-controls="app-collections-panel"
            >
              <Star className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              data-collections-trigger=""
              onClick={(e) => onOpenCollections?.("history", e.currentTarget)}
              className="glass glass-sm flex h-9 w-9 items-center justify-center"
              aria-label={t("collections.openHistory")}
              aria-controls="app-collections-panel"
            >
              <Clock className="h-4 w-4" aria-hidden />
            </button>

            <div className="flex w-9 shrink-0 justify-center">
              {geolocationSlot ?? (
                <button
                  type="button"
                  className="glass glass-sm flex h-9 w-9 items-center justify-center"
                  aria-label={t("header.geolocate")}
                  disabled
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
