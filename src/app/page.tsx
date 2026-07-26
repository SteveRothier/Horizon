import { AppShell } from "@/components/layout/AppShell";
import { DashboardSkeleton } from "@/components/ui/skeletons";

export default function Home() {
  return (
    <AppShell weather="clear" period="day">
      <DashboardSkeleton />
    </AppShell>
  );
}
