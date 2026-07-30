"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/utils/cn";
import type { WeatherCondition, DayPeriod } from "@/types/weather";
import { DEFAULT_PERIOD, DEFAULT_WEATHER } from "@/constants/design";

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
 * Viewport-locked chrome: header + sidebar + main filling remaining height.
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          background:
            "linear-gradient(145deg, var(--scene-from) 0%, var(--scene-via) 48%, var(--scene-to) 100%)",
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
        menuOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-[1440px] flex-1 flex-col overflow-x-hidden lg:flex-row">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          favoritesSlot={favoritesSlot}
          historySlot={historySlot}
          settingsSlot={settingsSlot}
        />

        <main
          id="main-content"
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto px-[var(--page-gutter)] py-[var(--page-gutter)] lg:pl-3"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
    </>
  );
}
