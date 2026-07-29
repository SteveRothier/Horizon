"use client";

import { useEffect, useRef } from "react";

const DRAG_THRESHOLD_PX = 4;

type UseGrabScrollOptions = {
  /** Fired when a drag starts / ends (DOM class is toggled without React state). */
  onGrabChange?: (grabbing: boolean) => void;
};

/**
 * Horizontal pan via pointer drag.
 * Uses a DOM class for the cursor — no React re-render on every grab.
 */
export function useGrabScroll<T extends HTMLElement>(
  options: UseGrabScrollOptions = {},
) {
  const ref = useRef<T>(null);
  const grabbingRef = useRef(false);
  const onGrabChangeRef = useRef(options.onGrabChange);
  onGrabChangeRef.current = options.onGrabChange;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const scrollEl = el;
    let activePointer: number | null = null;
    let startX = 0;
    let startScrollLeft = 0;
    let dragging = false;

    function setGrabbing(next: boolean) {
      if (grabbingRef.current === next) return;
      grabbingRef.current = next;
      scrollEl.classList.toggle("is-grabbing", next);
      onGrabChangeRef.current?.(next);
    }

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0) return;

      activePointer = event.pointerId;
      startX = event.clientX;
      startScrollLeft = scrollEl.scrollLeft;
      dragging = false;
      scrollEl.setPointerCapture(event.pointerId);
      window.getSelection()?.removeAllRanges();
    }

    function onPointerMove(event: PointerEvent) {
      if (activePointer !== event.pointerId) return;

      const delta = event.clientX - startX;
      if (!dragging && Math.abs(delta) < DRAG_THRESHOLD_PX) return;

      if (!dragging) {
        dragging = true;
        setGrabbing(true);
        window.getSelection()?.removeAllRanges();
      }

      event.preventDefault();
      scrollEl.scrollLeft = startScrollLeft - delta;
    }

    function endPointer(event: PointerEvent) {
      if (activePointer !== event.pointerId) return;

      activePointer = null;
      dragging = false;
      setGrabbing(false);

      try {
        scrollEl.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    }

    function onSelectStart(event: Event) {
      event.preventDefault();
    }

    scrollEl.addEventListener("pointerdown", onPointerDown);
    scrollEl.addEventListener("pointermove", onPointerMove);
    scrollEl.addEventListener("pointerup", endPointer);
    scrollEl.addEventListener("pointercancel", endPointer);
    scrollEl.addEventListener("selectstart", onSelectStart);

    return () => {
      scrollEl.removeEventListener("pointerdown", onPointerDown);
      scrollEl.removeEventListener("pointermove", onPointerMove);
      scrollEl.removeEventListener("pointerup", endPointer);
      scrollEl.removeEventListener("pointercancel", endPointer);
      scrollEl.removeEventListener("selectstart", onSelectStart);
    };
  }, []);

  return { ref, grabbingRef };
}
