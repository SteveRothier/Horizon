"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Star, X } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { selectLocation } from "@/utils/selectLocation";
import { cn } from "@/utils/cn";

type FavoritesListProps = {
  className?: string;
  onSelect?: () => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function FavoritesList({ className, onSelect }: FavoritesListProps) {
  const t = useT();
  const favorites = useFavoritesStore((s) => s.favorites);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const reduceMotion = useReducedMotion();

  if (favorites.length === 0) {
    return (
      <p className={cn("px-2 text-xs text-[var(--text-muted)]", className)}>
        {t("sidebar.noFavorites")}
      </p>
    );
  }

  return (
    <ul className={cn("space-y-0.5", className)}>
      <AnimatePresence initial={false}>
        {favorites.map((loc) => (
          <motion.li
            key={loc.id}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, x: -8, height: 0, marginBottom: 0 }
            }
            transition={{ duration: 0.25, ease }}
            className="group flex items-center gap-0.5 overflow-hidden"
          >
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
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] opacity-70 transition-opacity hover:bg-white/10 hover:text-[var(--text-primary)] hover:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              aria-label={t("favorites.removeNamed", { name: loc.name })}
              onClick={() => removeFavorite(loc.id)}
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
