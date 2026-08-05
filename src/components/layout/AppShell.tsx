"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { RefreshCw } from "lucide-react";
import {
  CollectionsPanel,
  anchorFromEventTarget,
  type CollectionsAnchor,
  type CollectionsView,
} from "@/components/layout/CollectionsPanel";
import { Header } from "@/components/layout/Header";
import { useIsMobileUi } from "@/hooks/useIsMobileUi";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { cn } from "@/utils/cn";
import type { WeatherCondition, DayPeriod } from "@/types/weather";
import { DEFAULT_PERIOD, DEFAULT_WEATHER, SCENE_GRADIENT } from "@/constants/design";

const WeatherBackground = dynamic(
  () =>
    import("@/features/background/WeatherBackground").then(
      (m) => m.WeatherBackground,
    ),
  { ssr: false },
);

type AppShellProps = {
  children: ReactNode;
  weather?: WeatherCondition;
  period?: DayPeriod;
  backgroundSlot?: ReactNode;
  searchSlot?: ReactNode;
  geolocationSlot?: ReactNode;
  settingsSlot?: ReactNode;
  favoritesSlot?: ReactNode;
  historySlot?: ReactNode;
  className?: string;
};

/**
 * Viewport-locked chrome: header + main filling remaining height.
 */
export function AppShell({
  children,
  weather = DEFAULT_WEATHER,
  period = DEFAULT_PERIOD,
  backgroundSlot,
  searchSlot,
  geolocationSlot,
  settingsSlot,
  favoritesSlot,
  historySlot,
  className,
}: AppShellProps) {
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [collectionsView, setCollectionsView] =
    useState<CollectionsView>("history");
  const [collectionsAnchor, setCollectionsAnchor] =
    useState<CollectionsAnchor | null>(null);
  const [mounted, setMounted] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobileUi();
  const { pullPx, refreshing, armed } = usePullToRefresh({
    scrollRef: mainRef,
    enabled: mounted && isMobile,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  function openCollections(
    view: CollectionsView,
    target?: EventTarget | null,
  ) {
    if (collectionsOpen && collectionsView === view) {
      setCollectionsOpen(false);
      return;
    }
    setCollectionsView(view);
    setCollectionsAnchor(anchorFromEventTarget(target ?? null));
    setCollectionsOpen(true);
  }

  function closeCollections() {
    setCollectionsOpen(false);
  }

  const backgroundLayer = (
    <div
      data-weather={weather}
      data-period={period}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Always-on gradient so dynamic WeatherBackground never leaves a hole */}
      <div
        className="absolute inset-0"
        style={{
          background: SCENE_GRADIENT,
        }}
      />
      {backgroundSlot ?? (
        <WeatherBackground condition={weather} period={period} />
      )}
    </div>
  );

  return (
    <>
      {mounted ? createPortal(backgroundLayer, document.body) : null}

      <div
        data-weather={weather}
        data-period={period}
        className={cn(
          "app-shell relative z-10 flex h-dvh max-h-dvh flex-col overflow-x-hidden overflow-y-hidden text-[var(--text-primary)]",
          className,
        )}
      >
        <Header
          searchSlot={searchSlot}
          geolocationSlot={geolocationSlot}
          onOpenCollections={openCollections}
        />

        <main
          ref={mainRef}
          id="main-content"
          className="relative mx-auto flex min-h-0 w-full min-w-0 max-w-[1440px] flex-1 flex-col overflow-x-hidden overflow-y-auto px-[var(--page-gutter)] py-[var(--page-gutter)]"
          tabIndex={-1}
        >
          {(pullPx > 0 || refreshing) && (
            <div
              className="pointer-events-none absolute left-0 right-0 top-1 z-20 flex justify-center"
              style={{
                opacity: refreshing ? 1 : Math.min(1, pullPx / 72),
                transform: `translateY(${Math.min(40, pullPx * 0.4)}px)`,
              }}
              aria-hidden
            >
              <RefreshCw
                className={cn(
                  "h-5 w-5 text-[var(--text-primary)] drop-shadow transition-transform",
                  armed && "animate-spin",
                )}
                strokeWidth={2.25}
              />
            </div>
          )}
          {children}
        </main>

        <CollectionsPanel
          open={collectionsOpen}
          onClose={closeCollections}
          view={collectionsView}
          anchor={collectionsAnchor}
          favoritesSlot={favoritesSlot}
          historySlot={historySlot}
          settingsSlot={settingsSlot}
        />
      </div>
    </>
  );
}
