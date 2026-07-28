"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/utils/cn";

type GlassToastProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  durationMs?: number;
  className?: string;
};

export function GlassToast({
  open,
  message,
  onClose,
  durationMs = 2000,
  className,
}: GlassToastProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2",
            "rounded-[var(--glass-radius-sm)] border border-[var(--glass-border-strong)]",
            "bg-[rgba(14,22,34,0.88)] px-4 py-2.5 text-sm text-[var(--text-primary)]",
            "shadow-[var(--glass-shadow)] backdrop-blur-[28px] saturate-[150%]",
            className,
          )}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
