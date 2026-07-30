import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type DashboardLayoutProps = {
  hero: ReactNode;
  hourly: ReactNode;
  weekly: ReactNode;
  details: ReactNode;
  airQuality: ReactNode;
  uv: ReactNode;
  map: ReactNode;
  className?: string;
};

/**
 * Viewport-filling dashboard grid — no page scroll on tablet+.
 * Mobile: compact 2-col grid that still aims to fit short viewports.
 */
export function DashboardLayout({
  hero,
  hourly,
  weekly,
  details,
  airQuality,
  uv,
  map,
  className,
}: DashboardLayoutProps) {
  return (
    <div
      className={cn(
        "dashboard-grid h-full min-h-0 w-full min-w-0 max-w-full gap-[var(--grid-gap)]",
        className,
      )}
    >
      <section className="dashboard-area-hero min-h-0 min-w-0 [&>*]:h-full [&>*]:min-w-0">
        {hero}
      </section>
      <section className="dashboard-area-weekly min-h-0 min-w-0 [&>*]:h-full [&>*]:min-w-0">
        {weekly}
      </section>
      <section className="dashboard-area-hourly min-h-0 min-w-0 [&>*]:h-full [&>*]:min-w-0">
        {hourly}
      </section>
      <section className="dashboard-area-details min-h-0 min-w-0 [&>*]:h-full [&>*]:min-w-0">
        {details}
      </section>
      <section className="dashboard-area-aqi min-h-0 min-w-0 [&>*]:h-full [&>*]:min-w-0">
        {airQuality}
      </section>
      <section className="dashboard-area-uv min-h-0 min-w-0 [&>*]:h-full [&>*]:min-w-0">
        {uv}
      </section>
      <section className="dashboard-area-map min-h-0 min-w-0 [&>*]:h-full [&>*]:min-w-0">
        {map}
      </section>
    </div>
  );
}
