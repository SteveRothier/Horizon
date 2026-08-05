import { DashboardSkeleton } from "@/components/ui/skeletons";

export default function CityWeatherLoading() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-[var(--page-gutter)] py-[var(--page-gutter)]">
      <DashboardSkeleton />
    </div>
  );
}
