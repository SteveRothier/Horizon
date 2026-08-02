import { cn } from "@/utils/cn";

type SkeletonProps = {
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
};

/** Base shimmer block — glass skeleton, no classic spinner */
export function Skeleton({ className, label }: SkeletonProps) {
  const decorative = !label;

  return (
    <div
      role={decorative ? undefined : "status"}
      aria-busy={decorative ? undefined : true}
      aria-label={label}
      aria-hidden={decorative || undefined}
      className={cn(
        "skeleton-shimmer rounded-[var(--glass-radius-sm)]",
        className,
      )}
    />
  );
}
