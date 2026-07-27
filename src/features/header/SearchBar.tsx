"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, LoaderCircle, X } from "lucide-react";
import { useCitySearch } from "@/hooks/useGeocode";
import { useT } from "@/hooks/useT";
import type { GeoLocation } from "@/types/weather";
import { cn } from "@/utils/cn";
import { selectLocation } from "@/utils/selectLocation";

type SearchBarProps = {
  className?: string;
  onSelect?: (location: GeoLocation) => void;
};

export function SearchBar({ className, onSelect }: SearchBarProps) {
  const t = useT();
  const listId = useId();
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input.trim()), 280);
    return () => clearTimeout(timer);
  }, [input]);

  const { data: results = [], isFetching, isError, error } = useCitySearch(
    debounced,
    open && debounced.length >= 2,
  );

  const trimmed = input.trim();
  const isDebouncing = trimmed.length >= 2 && trimmed !== debounced;
  const isSearching = isDebouncing || isFetching;
  const showDropdown = open && debounced.length >= 2 && !isSearching;

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
    selectLocation(loc);
    onSelect?.(loc);
    setInput(loc.name);
    setOpen(false);
  }

  function clearInput() {
    setInput("");
    setDebounced("");
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
        {t("header.searchLabel")}
      </label>
      <div className="glass glass-sm flex h-9 w-full items-center gap-2 px-3 sm:h-10 sm:gap-3 sm:px-4">
        {isSearching ? (
          <LoaderCircle
            className="h-4 w-4 shrink-0 text-[var(--text-muted)] search-spinner"
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
          aria-expanded={showDropdown && (results.length > 0 || isError)}
          aria-busy={isSearching}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && results[activeIndex]
              ? `${listId}-opt-${activeIndex}`
              : undefined
          }
          autoComplete="off"
          placeholder={t("header.searchPlaceholder")}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)]",
            "border-0 outline-none ring-0 shadow-none",
            "placeholder:text-[var(--text-muted)]",
            "focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none",
            "focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none",
            "appearance-none",
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden",
            "[&::-webkit-search-decoration]:appearance-none",
            "[&::-ms-clear]:hidden",
          )}
        />
        {input ? (
          <button
            type="button"
            onClick={clearInput}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
            aria-label={t("header.clearSearch")}
            title={t("header.clearSearch")}
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <ul
          id={listId}
          role="listbox"
          className="glass absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-64 overflow-auto rounded-[var(--glass-radius-sm)] p-1 shadow-[var(--glass-shadow)]"
        >
          {isError ? (
            <li className="px-3 py-2 text-sm text-red-200">
              {error instanceof Error
                ? error.message
                : t("header.searchFailed")}
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--text-muted)]">
              {t("header.noResults")}
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
