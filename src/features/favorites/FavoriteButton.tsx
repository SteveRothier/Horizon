"use client";

import { Star } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useFavoritesStore } from "@/stores/favoritesStore";
import type { GeoLocation } from "@/types/weather";
import { cn } from "@/utils/cn";

type FavoriteButtonProps = {
  location: GeoLocation;
  className?: string;
};

export function FavoriteButton({ location, className }: FavoriteButtonProps) {
  const t = useT();
  const isFavorite = useFavoritesStore((s) =>
    s.favorites.some((f) => f.id === location.id),
  );
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const label = isFavorite ? t("favorites.remove") : t("favorites.add");

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(location)}
      className={cn(
        "glass glass-sm flex h-9 w-9 shrink-0 items-center justify-center transition-colors",
        isFavorite
          ? "text-[var(--accent)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
        className,
      )}
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
    >
      <Star
        className={cn("h-4 w-4", isFavorite && "fill-current")}
        aria-hidden
      />
    </button>
  );
}
