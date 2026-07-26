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
        "dashboard-grid h-full min-h-0 w-full gap-[var(--grid-gap)]",
        className,
      )}
    >
      <section className="dashboard-area-hero min-h-0 [&>*]:h-full">
        {hero}
      </section>
      <section className="dashboard-area-weekly min-h-0 [&>*]:h-full">
        {weekly}
      </section>
      <section className="dashboard-area-hourly min-h-0 [&>*]:h-full">
        {hourly}
      </section>
      <section className="dashboard-area-details min-h-0 [&>*]:h-full">
        {details}
      </section>
      <section className="dashboard-area-aqi min-h-0 [&>*]:h-full">
        {airQuality}
      </section>
      <section className="dashboard-area-uv min-h-0 [&>*]:h-full">
        {uv}
      </section>
      <section className="dashboard-area-map min-h-0 [&>*]:h-full">
        {map}
      </section>
    </div>
  );
}
