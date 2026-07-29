"use client";

import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px), (pointer: coarse)";

/** True on narrow viewports or coarse pointers (phones / tablets). */
export function useIsMobileUi() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isMobile;
}
