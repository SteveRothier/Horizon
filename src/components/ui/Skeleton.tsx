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

export function SkeletonText({
  className,
  lines = 1,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3 w-full", i === lines - 1 && lines > 1 && "w-2/3")}
          label=""
        />
      ))}
    </div>
  );
}
