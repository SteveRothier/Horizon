"use client";

import type { ReactNode } from "react";
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={locationId}
        className={className}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
        transition={{ duration: 0.3, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
