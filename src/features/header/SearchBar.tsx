"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useCitySearch } from "@/hooks/useGeocode";
import { useLocationStore } from "@/stores/locationStore";
import type { GeoLocation } from "@/types/weather";
import { cn } from "@/utils/cn";

type SearchBarProps = {
  className?: string;
  onSelect?: (location: GeoLocation) => void;
};

export function SearchBar({ className, onSelect }: SearchBarProps) {
  const listId = useId();
  const setLocation = useLocationStore((s) => s.setLocation);
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), 280);
    return () => clearTimeout(t);
  }, [input]);

  const { data: results = [], isFetching, isError, error } = useCitySearch(
    debounced,
    open && debounced.length >= 2,
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(loc: GeoLocation) {
    setLocation(loc);
    onSelect?.(loc);
    setInput(loc.name);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (e.key === "Enter" && results[0]) {
        e.preventDefault();
        choose(results[0]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIndex] ?? results[0];
      if (pick) choose(pick);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <label className="sr-only" htmlFor="city-search">
        Rechercher une ville
      </label>
      <div className="glass glass-sm flex h-9 w-full items-center gap-2 px-3 sm:h-10 sm:gap-3 sm:px-4">
        {isFetching ? (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-[var(--text-muted)]"
            aria-hidden
          />
        ) : (
          <Search
            className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
            aria-hidden
          />
        )}
        <input
          id="city-search"
          type="search"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && results[activeIndex]
              ? `${listId}-opt-${activeIndex}`
              : undefined
          }
          autoComplete="off"
          placeholder="Rechercher une ville…"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>

      {open && debounced.length >= 2 ? (
        <ul
          id={listId}
          role="listbox"
          className="glass absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-64 overflow-auto rounded-[var(--glass-radius-sm)] p-1 shadow-[var(--glass-shadow)]"
        >
          {isError ? (
            <li className="px-3 py-2 text-sm text-red-200">
              {error instanceof Error
                ? error.message
                : "Recherche impossible"}
            </li>
          ) : results.length === 0 && !isFetching ? (
            <li className="px-3 py-2 text-sm text-[var(--text-muted)]">
              Aucune ville trouvée
            </li>
          ) : (
            results.map((loc, i) => (
              <li key={loc.id} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  id={`${listId}-opt-${i}`}
                  className={cn(
                    "flex w-full flex-col items-start rounded-[calc(var(--glass-radius-sm)-4px)] px-3 py-2 text-left text-sm transition-colors",
                    i === activeIndex
                      ? "bg-white/15 text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-white/10",
                  )}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => choose(loc)}
                >
                  <span className="font-medium text-[var(--text-primary)]">
                    {loc.name}
                  </span>
                  <span className="truncate text-xs text-[var(--text-muted)]">
                    {[loc.admin1, loc.country].filter(Boolean).join(", ")}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
