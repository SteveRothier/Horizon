"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useFavoritesStore } from "@/stores/favoritesStore";
import type { GeoLocation } from "@/types/weather";
import { sameLocation } from "@/utils/location-match";
import { cn } from "@/utils/cn";

type FavoriteButtonProps = {
  location: GeoLocation;
  className?: string;
};

export function FavoriteButton({ location, className }: FavoriteButtonProps) {
  const t = useT();
  const [bumpKey, setBumpKey] = useState(0);
  const isFavorite = useFavoritesStore((s) =>
    s.favorites.some((f) => sameLocation(f, location)),
  );
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const label = isFavorite ? t("favorites.remove") : t("favorites.add");

  function onToggle() {
    toggleFavorite(location);
    setBumpKey((n) => n + 1);
  }

  return (
    <button
      type="button"
      onClick={onToggle}
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
      <span
        key={bumpKey}
        className={cn("inline-flex", bumpKey > 0 && "action-bounce")}
      >
        <Star
          className={cn("h-4 w-4", isFavorite && "fill-current")}
          aria-hidden
        />
      </span>
    </button>
  );
}
