import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type DashboardLayoutProps = {
  hero: ReactNode;
  forecast: ReactNode;
  details: ReactNode;
  airQuality: ReactNode;
  uv: ReactNode;
  map: ReactNode;
  className?: string;
};

/**
 * Dashboard grid — fills tall viewports, scrolls in #main-content when content overflows.
 */
export function DashboardLayout({
  hero,
  forecast,
  details,
  airQuality,
  uv,
  map,
  className,
}: DashboardLayoutProps) {
  return (
    <div
      className={cn(
        "dashboard-grid w-full min-w-0 max-w-full gap-[var(--grid-gap)]",
        className,
      )}
    >
      <section className="dashboard-area-hero min-h-0 min-w-0 [&>*]:min-h-full [&>*]:w-full [&>*]:min-w-0">
        {hero}
      </section>
      <section className="dashboard-area-forecast min-h-0 min-w-0 [&>*]:min-h-full [&>*]:w-full [&>*]:min-w-0">
        {forecast}
      </section>
      <section className="dashboard-area-details min-h-0 min-w-0 [&>*]:min-h-full [&>*]:w-full [&>*]:min-w-0">
        {details}
      </section>
      <section className="dashboard-area-aqi min-h-0 min-w-0 [&>*]:min-h-full [&>*]:w-full [&>*]:min-w-0">
        {airQuality}
      </section>
      <section className="dashboard-area-uv min-h-0 min-w-0 [&>*]:min-h-full [&>*]:w-full [&>*]:min-w-0">
        {uv}
      </section>
      <section className="dashboard-area-map min-h-0 min-w-0">
        {map}
      </section>
    </div>
  );
}
