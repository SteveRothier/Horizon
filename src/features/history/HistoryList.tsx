"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useHistoryStore } from "@/stores/historyStore";
import { selectLocation } from "@/utils/selectLocation";
import { cn } from "@/utils/cn";

type HistoryListProps = {
  className?: string;
  onSelect?: () => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function HistoryList({ className, onSelect }: HistoryListProps) {
  const t = useT();
  const items = useHistoryStore((s) => s.items);
  const removeFromHistory = useHistoryStore((s) => s.removeFromHistory);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canAnimate = mounted && !reduceMotion;

  if (items.length === 0) {
    return (
      <p className={cn("px-2.5 py-2 text-sm text-[var(--text-muted)]", className)}>
        {t("sidebar.noRecent")}
      </p>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <ul className="space-y-0.5">
        <AnimatePresence initial={false}>
          {items.map((loc) => (
            <motion.li
              key={loc.id}
              layout={canAnimate}
              initial={canAnimate ? { opacity: 0, x: -8 } : false}
              animate={{ opacity: 1, x: 0 }}
              exit={
                canAnimate
                  ? { opacity: 0, x: -8, height: 0, marginBottom: 0 }
                  : undefined
              }
              transition={
                canAnimate ? { duration: 0.25, ease } : { duration: 0 }
              }
              className="group flex items-center gap-0.5 overflow-hidden"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center rounded-[calc(var(--glass-radius-sm)-4px)] px-2.5 py-2 text-left text-sm text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
                onClick={() => {
                  selectLocation(loc);
                  onSelect?.();
                }}
              >
                <span className="truncate font-medium text-[var(--text-primary)]">
                  {loc.name}
                </span>
              </button>
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] opacity-70 transition-opacity hover:bg-white/10 hover:text-[var(--text-primary)] hover:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                aria-label={t("history.removeNamed", { name: loc.name })}
                onClick={() => removeFromHistory(loc.id)}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <button
        type="button"
        className="mx-1 mb-0.5 rounded-[calc(var(--glass-radius-sm)-4px)] px-2.5 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--text-secondary)]"
        onClick={() => clearHistory()}
      >
        {t("sidebar.clearHistory")}
      </button>
    </div>
  );
}
