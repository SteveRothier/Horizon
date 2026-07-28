"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canAnimate = mounted && !reduceMotion;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={locationId}
        className={className}
        initial={canAnimate ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={canAnimate ? { opacity: 0, y: -6 } : undefined}
        transition={{ duration: 0.3, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
