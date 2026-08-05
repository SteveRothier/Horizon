"use client";

import { useEffect, useState } from "react";

type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

type StoreWithPersist = {
  /** Absent during SSR — zustand skip attaching persist when storage is unavailable. */
  persist?: PersistApi;
};

/**
 * Wait for a zustand persist store to finish rehydration.
 * Safe on SSR: starts false, then syncs on the client (where `.persist` exists).
 */
export function usePersistHydrated(store: StoreWithPersist) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persist = store.persist;
    if (!persist) {
      // No persist API (SSR-created store / no storage) — treat as ready on client.
      setHydrated(true);
      return;
    }
    if (persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, [store]);

  return hydrated;
}
