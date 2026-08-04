import { DashboardSkeleton } from "@/components/ui/skeletons";

export default function CityWeatherLoading() {
  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-[1440px] flex-col overflow-hidden px-[var(--page-gutter)] py-[var(--page-gutter)]">
      <div className="min-h-0 flex-1 overflow-hidden">
        <DashboardSkeleton />
      </div>
    </div>
  );
}
