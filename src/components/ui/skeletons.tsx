import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const cardShell =
  "flex h-full min-h-0 flex-col overflow-hidden p-[var(--card-pad)]";

export function WeatherHeroSkeleton() {
  return (
    <GlassCard
      interactive={false}
      animate={false}
      className={cardShell}
      aria-label="Chargement de la météo actuelle"
    >
      <div className="flex min-h-0 flex-1 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-28 sm:h-14 sm:w-32 xl:h-16 xl:w-36" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="mt-auto grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-2.5 w-10" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-16 w-16 shrink-0 rounded-full sm:h-20 sm:w-20 xl:h-24 xl:w-24" />
      </div>
    </GlassCard>
  );
}

export function HourlyForecastSkeleton() {
  return (
    <GlassCard
      interactive={false}
      animate={false}
      className={cardShell}
      aria-label="Chargement des prévisions horaires"
    >
      <Skeleton className="mb-2 h-3.5 w-32 shrink-0" />
      <div className="flex min-h-0 flex-1 items-center gap-2 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex w-11 shrink-0 flex-col items-center gap-1.5 sm:w-12"
          >
            <Skeleton className="h-2.5 w-8" />
            <Skeleton className="h-7 w-7 rounded-full sm:h-8 sm:w-8" />
            <Skeleton className="h-3 w-7" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function WeeklyForecastSkeleton() {
  return (
    <GlassCard
      interactive={false}
      animate={false}
      className={cardShell}
      aria-label="Chargement des prévisions sur 7 jours"
    >
      <Skeleton className="mb-2 h-3.5 w-28 shrink-0" />
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex min-h-0 flex-1 items-center gap-2">
            <Skeleton className="h-3 w-9 shrink-0" />
            <Skeleton className="h-5 w-5 shrink-0 rounded-full sm:h-6 sm:w-6" />
            <Skeleton className="h-2 flex-1" />
            <Skeleton className="h-3 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function GaugeSkeleton({ label = "Indicateur" }: { label?: string }) {
  return (
    <GlassCard
      interactive={false}
      animate={false}
      className={cardShell}
      aria-label={`Chargement — ${label}`}
    >
      <Skeleton className="mb-2 h-3.5 w-24 shrink-0" />
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Skeleton className="aspect-square h-[min(100%,5.5rem)] w-auto max-w-full rounded-full sm:h-[min(100%,6.5rem)]" />
      </div>
      <Skeleton className="mt-2 h-2.5 w-full shrink-0" />
      <Skeleton className="mt-1.5 h-2.5 w-3/4 shrink-0" />
    </GlassCard>
  );
}

export function DetailsSkeleton() {
  return (
    <GlassCard
      interactive={false}
      animate={false}
      className={cardShell}
      aria-label="Chargement des détails météo"
    >
      <Skeleton className="mb-2 h-3.5 w-24 shrink-0" />
      <div className="grid min-h-0 flex-1 grid-cols-2 content-center gap-x-3 gap-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-3.5 w-14" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function MapSkeleton() {
  return (
    <GlassCard
      interactive={false}
      animate={false}
      className="h-full min-h-0 overflow-hidden p-0"
      aria-label="Chargement de la carte"
    >
      <Skeleton className="h-full w-full rounded-[var(--glass-radius)]" />
    </GlassCard>
  );
}

/** Full dashboard loading state — fills viewport via DashboardLayout */
export function DashboardSkeleton() {
  return (
    <DashboardLayout
      hero={<WeatherHeroSkeleton />}
      hourly={<HourlyForecastSkeleton />}
      weekly={<WeeklyForecastSkeleton />}
      details={<DetailsSkeleton />}
      airQuality={<GaugeSkeleton label="Qualité de l'air" />}
      uv={<GaugeSkeleton label="Indice UV" />}
      map={<MapSkeleton />}
    />
  );
}
