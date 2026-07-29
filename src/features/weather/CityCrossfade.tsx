"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useIsMobileUi } from "@/hooks/useIsMobileUi";

const ease = [0.22, 1, 0.36, 1] as const;

type CityCrossfadeProps = {
  locationId: string;
  children: ReactNode;
  className?: string;
};

/** Crossfade content when the selected city changes. */
export function CityCrossfade({
  locationId,
  children,
  className = "h-full min-h-0",
}: CityCrossfadeProps) {
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobileUi();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canAnimate = mounted && !reduceMotion;
  // Mobile: opacity-only (no y) to avoid backdrop+transform flicker
  const useSlide = canAnimate && !isMobile;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={locationId}
        className={className}
        initial={
          canAnimate
            ? useSlide
              ? { opacity: 0, y: 8 }
              : { opacity: 0 }
            : false
        }
        animate={useSlide ? { opacity: 1, y: 0 } : { opacity: 1 }}
        exit={
          canAnimate
            ? useSlide
              ? { opacity: 0, y: -6 }
              : { opacity: 0 }
            : undefined
        }
        transition={{ duration: isMobile ? 0.2 : 0.3, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
