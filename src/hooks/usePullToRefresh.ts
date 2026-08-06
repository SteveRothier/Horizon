"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const PULL_THRESHOLD_PX = 72;
const MAX_PULL_PX = 96;

type UsePullToRefreshOptions = {
  /** Scroll container that owns vertical overflow. */
  scrollRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
};

/**
 * Mobile pull-to-refresh on a nested scroll container (document PTR won't fire
 * when body is overflow:hidden and main scrolls).
 */
export function usePullToRefresh({
  scrollRef,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [pullPx, setPullPx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;

    const onTouchStart = (event: TouchEvent) => {
      if (refreshing) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(".leaflet-container, .leaflet-pane")
      ) {
        pullingRef.current = false;
        return;
      }
      if (el.scrollTop > 0) {
        pullingRef.current = false;
        return;
      }
      startYRef.current = event.touches[0]?.clientY ?? 0;
      pullingRef.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pullingRef.current || refreshing) return;
      if (el.scrollTop > 0) {
        pullingRef.current = false;
        setPullPx(0);
        return;
      }
      const y = event.touches[0]?.clientY ?? 0;
      const delta = y - startYRef.current;
      if (delta <= 0) {
        setPullPx(0);
        return;
      }
      // Resist a bit so it feels like native PTR.
      const resisted = Math.min(MAX_PULL_PX, delta * 0.45);
      setPullPx(resisted);
      if (resisted > 8) {
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      setPullPx((current) => {
        if (current >= PULL_THRESHOLD_PX) {
          setRefreshing(true);
          window.location.reload();
          return current;
        }
        return 0;
      });
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, refreshing, scrollRef]);

  return {
    pullPx,
    refreshing,
    armed: pullPx >= PULL_THRESHOLD_PX || refreshing,
  };
}
