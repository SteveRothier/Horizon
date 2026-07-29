"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
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

  return (
    <div
      data-weather={weather}
      data-period={period}
      className={cn(
        "app-shell relative flex h-dvh max-h-dvh flex-col overflow-hidden text-[var(--text-primary)]",
        className,
      )}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
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

      <Header
        searchSlot={searchSlot}
        geolocationSlot={geolocationSlot}
        menuOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          favoritesSlot={favoritesSlot}
          historySlot={historySlot}
          settingsSlot={settingsSlot}
        />

        <main
          id="main-content"
          className="flex min-h-0 min-w-0 flex-1 flex-col px-[var(--page-gutter)] py-[var(--page-gutter)] lg:pl-3"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
