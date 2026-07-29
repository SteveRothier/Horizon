"use client";

import { useEffect, useRef, useState } from "react";

const DRAG_THRESHOLD_PX = 4;

/** Horizontal pan via pointer drag with grab / grabbing cursor. */
export function useGrabScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const scrollEl = el;
    let activePointer: number | null = null;
    let startX = 0;
    let startScrollLeft = 0;
    let dragging = false;

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

  return { ref, grabbing };
}
