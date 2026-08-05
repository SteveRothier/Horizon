"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useIsMobileUi } from "@/hooks/useIsMobileUi";

const ease = [0.22, 1, 0.36, 1] as const;

type CityCrossfadeProps = {
  locationId: string;
  children: ReactNode;
  className?: string;
};

/**
 * Soft opacity pulse on city change — children stay mounted (map / chart
 * keep their internal state instead of remounting via AnimatePresence key).
 */
export function CityCrossfade({
  locationId,
  children,
  className = "w-full min-w-0",
}: CityCrossfadeProps) {
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobileUi();
  const [mounted, setMounted] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [prevId, setPrevId] = useState(locationId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (locationId === prevId) return;
    setPrevId(locationId);
    if (!mounted || reduceMotion) return;
    setPulse(true);
    const timer = window.setTimeout(() => setPulse(false), isMobile ? 200 : 280);
    return () => window.clearTimeout(timer);
  }, [locationId, prevId, mounted, reduceMotion, isMobile]);

  const canAnimate = mounted && !reduceMotion;

  return (
    <AnimatePresence initial={false}>
      <m.div
        className={className}
        animate={
          canAnimate
            ? pulse
              ? { opacity: isMobile ? 0.92 : 0.88 }
              : { opacity: 1 }
            : { opacity: 1 }
        }
        transition={{ duration: isMobile ? 0.2 : 0.28, ease }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
