"use client";

import { Star, X } from "lucide-react";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { selectLocation } from "@/utils/selectLocation";
import { cn } from "@/utils/cn";

type FavoritesListProps = {
  className?: string;
  onSelect?: () => void;
};

export function FavoritesList({ className, onSelect }: FavoritesListProps) {
  const favorites = useFavoritesStore((s) => s.favorites);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);

  if (favorites.length === 0) {
    return (
      <p className={cn("px-2 text-xs text-[var(--text-muted)]", className)}>
        Aucun favori
      </p>
    );
  }

  return (
    <ul className={cn("space-y-0.5", className)}>
      {favorites.map((loc) => (
        <li key={loc.id} className="group flex items-center gap-0.5">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--glass-radius-sm)] px-2 py-1.5 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
            onClick={() => {
              selectLocation(loc);
              onSelect?.();
            }}
          >
            <Star
              className="h-3 w-3 shrink-0 fill-current text-[var(--accent)]"
              aria-hidden
            />
            <span className="truncate">{loc.name}</span>
          </button>
          <button
            type="button"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-white/10 hover:text-[var(--text-primary)] group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Retirer ${loc.name} des favoris`}
            onClick={() => removeFavorite(loc.id)}
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
