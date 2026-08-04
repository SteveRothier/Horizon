"use client";

import { cloneElement, isValidElement, useMemo, useState, type ReactNode } from "react";
import { Search, MapPin, Star, Clock, Settings } from "lucide-react";
import { useT } from "@/hooks/useT";
import type { CollectionsView } from "@/components/layout/CollectionsPanel";
import { cn } from "@/utils/cn";

type HeaderProps = {
  searchSlot?: ReactNode;
  geolocationSlot?: ReactNode;
  onOpenCollections?: (
    view: CollectionsView,
    target?: EventTarget | null,
  ) => void;
  className?: string;
};

export function Header({
  searchSlot,
  geolocationSlot,
  onOpenCollections,
  className,
}: HeaderProps) {
  const t = useT();
  const [searchFocused, setSearchFocused] = useState(false);
  const resolvedSearchSlot = useMemo(() => {
    if (!isValidElement(searchSlot)) return searchSlot;
    type SearchFocusableProps = {
      onFocusChange?: (focused: boolean) => void;
    };
    const existing = searchSlot.props as SearchFocusableProps;
    return cloneElement(searchSlot, {
      onFocusChange: (focused: boolean) => {
        existing.onFocusChange?.(focused);
        setSearchFocused(focused);
      },
    });
  }, [searchSlot]);

  return (
    <header className={cn("sticky top-0 z-40 w-full min-w-0 shrink-0", className)}>
      <div className="mx-auto flex h-[var(--header-height)] w-full min-w-0 max-w-[1440px] items-center gap-2 px-[var(--page-gutter)] sm:gap-3">
        <span className="shrink-0 font-[family-name:var(--font-horizon-display)] text-base font-semibold tracking-tight text-[var(--text-primary)] sm:text-lg xl:text-xl">
          {t("header.brand")}
        </span>

        {/* Mobile idle: search + ★/⏱/⚙ + pin. Focus: search expands over ★/⏱/⚙. */}
        <div className="relative flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <div
            className={cn(
              "header-search-fly min-w-0 flex-1",
              "max-sm:absolute max-sm:inset-y-0 max-sm:left-0 max-sm:right-[calc(9.75rem+1.125rem)] max-sm:z-20",
              searchFocused && "max-sm:right-[calc(2.25rem+0.375rem)]",
            )}
          >
            {resolvedSearchSlot ?? (
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

          <div className="relative z-30 ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                "header-actions-fly flex items-center gap-1.5 sm:gap-2",
                searchFocused &&
                  "max-sm:pointer-events-none max-sm:translate-x-1 max-sm:opacity-0",
              )}
            >
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
              <button
                type="button"
                data-collections-trigger=""
                onClick={(e) =>
                  onOpenCollections?.("settings", e.currentTarget)
                }
                className="glass glass-sm flex h-9 w-9 items-center justify-center"
                aria-label={t("collections.openSettings")}
                aria-controls="app-collections-panel"
              >
                <Settings className="h-4 w-4" aria-hidden />
              </button>
            </div>

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
