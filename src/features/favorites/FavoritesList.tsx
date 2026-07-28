"use client";

import { useEffect, useRef, useState, type AnimationEvent } from "react";
import { Star, X } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useFavoritesStore } from "@/stores/favoritesStore";
import type { GeoLocation } from "@/types/weather";
import { selectLocation } from "@/utils/selectLocation";
import { cn } from "@/utils/cn";

type FavoritesListProps = {
  className?: string;
  onSelect?: () => void;
};

type VisibleItem = {
  location: GeoLocation;
  phase: "in" | "idle" | "out";
};

export function FavoritesList({ className, onSelect }: FavoritesListProps) {
  const t = useT();
  const favorites = useFavoritesStore((s) => s.favorites);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const [items, setItems] = useState<VisibleItem[]>([]);
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      setItems(favorites.map((location) => ({ location, phase: "idle" })));
      return;
    }

    setItems((prev) => {
      const prevById = new Map(prev.map((item) => [item.location.id, item]));
      const next: VisibleItem[] = [];

      for (const location of favorites) {
        const existing = prevById.get(location.id);
        if (existing && existing.phase !== "out") {
          next.push({
            location,
            phase: existing.phase === "in" ? "in" : "idle",
          });
        } else {
          next.push({ location, phase: "in" });
        }
        prevById.delete(location.id);
      }

      for (const leftover of prevById.values()) {
        next.push(
          leftover.phase === "out"
            ? leftover
            : { ...leftover, phase: "out" },
        );
      }

      return next;
    });
  }, [favorites]);

  function requestRemove(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.location.id === id ? { ...item, phase: "out" } : item,
      ),
    );
  }

  function onItemAnimationEnd(
    event: AnimationEvent<HTMLLIElement>,
    id: string,
    phase: VisibleItem["phase"],
  ) {
    if (event.target !== event.currentTarget) return;

    if (phase === "in") {
      setItems((prev) =>
        prev.map((item) =>
          item.location.id === id && item.phase === "in"
            ? { ...item, phase: "idle" }
            : item,
        ),
      );
      return;
    }

    if (phase === "out") {
      const stillInStore = useFavoritesStore
        .getState()
        .favorites.some((f) => f.id === id);
      if (stillInStore) removeFavorite(id);
      setItems((prev) => prev.filter((item) => item.location.id !== id));
    }
  }

  return (
    <div className={cn("relative min-h-[1.5rem]", className)}>
      <ul className="space-y-0.5">
        {items.map(({ location: loc, phase }) => (
          <li
            key={loc.id}
            className={cn(
              "group flex items-center gap-0.5",
              phase === "in" && "list-item-in",
              phase === "out" && "list-item-out",
            )}
            onAnimationEnd={(event) => onItemAnimationEnd(event, loc.id, phase)}
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--glass-radius-sm)] px-2 py-1.5 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
              onClick={() => {
                selectLocation(loc);
                onSelect?.();
              }}
            >
              <span
                className={cn(
                  "inline-flex shrink-0",
                  phase === "in" && "action-bounce",
                )}
              >
                <Star
                  className="h-3 w-3 fill-current text-[var(--accent)]"
                  aria-hidden
                />
              </span>
              <span className="truncate">{loc.name}</span>
            </button>
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] opacity-70 transition-opacity hover:bg-white/10 hover:text-[var(--text-primary)] hover:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              aria-label={t("favorites.removeNamed", { name: loc.name })}
              onClick={() => requestRemove(loc.id)}
              disabled={phase === "out"}
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {items.length === 0 ? (
        <p className="px-2 text-xs text-[var(--text-muted)]">
          {t("sidebar.noFavorites")}
        </p>
      ) : null}
    </div>
  );
}
