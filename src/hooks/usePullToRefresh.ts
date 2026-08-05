"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  airQualityQueryPrefix,
  weatherQueryPrefix,
} from "@/hooks/query-keys";

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
  const queryClient = useQueryClient();
  const [pullPx, setPullPx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullRafRef = useRef(0);
  const pendingPullRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;

    const flushPull = () => {
      pullRafRef.current = 0;
      setPullPx(pendingPullRef.current);
    };

    const schedulePull = (value: number) => {
      pendingPullRef.current = value;
      if (pullRafRef.current) return;
      pullRafRef.current = requestAnimationFrame(flushPull);
    };

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
        schedulePull(0);
        return;
      }
      const y = event.touches[0]?.clientY ?? 0;
      const delta = y - startYRef.current;
      if (delta <= 0) {
        schedulePull(0);
        return;
      }
      // Resist a bit so it feels like native PTR.
      const resisted = Math.min(MAX_PULL_PX, delta * 0.45);
      schedulePull(resisted);
      if (resisted > 8) {
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      const current = pendingPullRef.current;
      if (current >= PULL_THRESHOLD_PX) {
        setRefreshing(true);
        schedulePull(current);
        void (async () => {
          try {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: [...weatherQueryPrefix] }),
              queryClient.invalidateQueries({
                queryKey: [...airQualityQueryPrefix],
              }),
            ]);
          } finally {
            setRefreshing(false);
            schedulePull(0);
          }
        })();
        return;
      }
      schedulePull(0);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      if (pullRafRef.current) cancelAnimationFrame(pullRafRef.current);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, refreshing, scrollRef, queryClient]);

  return { pullPx, refreshing, armed: pullPx >= PULL_THRESHOLD_PX || refreshing };
}
