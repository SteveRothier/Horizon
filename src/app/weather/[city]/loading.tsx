import { DashboardSkeleton } from "@/components/ui/skeletons";

export default function CityWeatherLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col px-[var(--page-gutter)] py-[var(--page-gutter)]">
      <DashboardSkeleton />
    </div>
  );
}
