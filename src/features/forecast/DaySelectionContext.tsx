"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DaySelectionContextValue = {
  activeDate: string | null;
  todayDate: string | null;
  setSelectedDate: (date: string | null) => void;
};

const DaySelectionContext = createContext<DaySelectionContextValue | null>(
  null,
);

type DaySelectionProviderProps = {
  todayDate: string | null;
  /** Reset selection when the city / fetch changes. */
  resetKey: string;
  children: ReactNode;
};

/** Isolates day selection so Hero / Map / Details skip re-renders on day change. */
export function DaySelectionProvider({
  todayDate,
  resetKey,
  children,
}: DaySelectionProviderProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(null);
  }, [resetKey]);

  const value = useMemo<DaySelectionContextValue>(
    () => ({
      activeDate: selectedDate ?? todayDate,
      todayDate,
      setSelectedDate,
    }),
    [selectedDate, todayDate],
  );

  return (
    <DaySelectionContext.Provider value={value}>
      {children}
    </DaySelectionContext.Provider>
  );
}

export function useDaySelection() {
  const ctx = useContext(DaySelectionContext);
  if (!ctx) {
    throw new Error("useDaySelection must be used within DaySelectionProvider");
  }
  return ctx;
}
