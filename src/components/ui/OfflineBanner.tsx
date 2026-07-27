"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

type OfflineBannerProps = {
  className?: string;
};

/** Live online/offline status for clear UX when the network drops. */
export function OfflineBanner({ className }: OfflineBannerProps) {
  const t = useT();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function sync() {
      setOnline(navigator.onLine);
    }
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className={cn(
        "mb-2 flex shrink-0 items-center gap-2 rounded-[var(--glass-radius-sm)] border border-[var(--surface-error-border)] bg-[var(--surface-error)] px-3 py-2 text-sm",
        className,
      )}
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      <p>{t("error.offline")}</p>
    </div>
  );
}
