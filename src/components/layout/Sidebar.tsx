"use client";

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Home,
  Map,
  Star,
  Clock,
  Bell,
  Settings,
  Navigation,
  X,
} from "lucide-react";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/i18n/messages";
import { useLocationStore } from "@/stores/locationStore";
import { cn } from "@/utils/cn";

const NAV_ITEMS: {
  id: string;
  labelKey: MessageKey;
  icon: typeof Home;
  active: boolean;
}[] = [
  { id: "home", labelKey: "nav.home", icon: Home, active: true },
  { id: "map", labelKey: "nav.map", icon: Map, active: false },
  { id: "favorites", labelKey: "nav.favorites", icon: Star, active: false },
  { id: "history", labelKey: "nav.history", icon: Clock, active: false },
  { id: "alerts", labelKey: "nav.alerts", icon: Bell, active: false },
  { id: "settings", labelKey: "nav.settings", icon: Settings, active: false },
];

type SlotWithSelect = {
  onSelect?: () => void;
};

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  favoritesSlot?: ReactNode;
  historySlot?: ReactNode;
  className?: string;
};

function withCloseOnSelect(slot: ReactNode, onClose?: () => void): ReactNode {
  if (!isValidElement(slot) || !onClose) return slot;
  const element = slot as ReactElement<SlotWithSelect>;
  return cloneElement(element, {
    onSelect: () => {
      element.props.onSelect?.();
      onClose();
    },
  });
}

/**
 * Left navigation shell — glass panels with favorites / history slots.
 */
export function Sidebar({
  open = false,
  onClose,
  favoritesSlot,
  historySlot,
  className,
}: SidebarProps) {
  const t = useT();
  const location = useLocationStore((s) => s.location);
  const history = withCloseOnSelect(historySlot, onClose);
  const favorites = withCloseOnSelect(favoritesSlot, onClose);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(100%,var(--sidebar-width))] flex-col",
          "bg-white/[0.06] backdrop-blur-[var(--glass-blur)]",
          "transition-transform duration-300 ease-[var(--ease-out)]",
          "lg:static lg:z-0 lg:h-full lg:shrink-0 lg:translate-x-0 lg:self-stretch lg:bg-transparent lg:backdrop-blur-none",
          open ? "translate-x-0" : "-translate-x-full",
          className,
        )}
        aria-label={t("nav.main")}
      >
        <div className="flex h-[var(--header-height)] items-center justify-between px-4 lg:hidden">
          <span className="font-[family-name:var(--font-horizon-display)] text-lg font-semibold">
            {t("header.brand")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="glass glass-sm flex h-8 w-8 items-center justify-center"
            aria-label={t("sidebar.closeMenu")}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <nav
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-3 pt-2 lg:px-[var(--page-gutter)] lg:pb-[var(--page-gutter)] lg:pt-[var(--page-gutter)]"
          aria-label={t("nav.menu")}
        >
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ id, labelKey, icon: Icon, active }) => (
              <li key={id}>
                <a
                  href={id === "home" ? "#" : `#${id}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[var(--glass-radius-sm)] px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-white/15 text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]",
                  )}
                  aria-current={active ? "page" : undefined}
                  onClick={onClose}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  {t(labelKey)}
                </a>
              </li>
            ))}
          </ul>

          <section
            className="mt-4 px-1"
            aria-labelledby="sidebar-history-title"
          >
            <h2
              id="sidebar-history-title"
              className="mb-1.5 px-2 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--text-muted)]"
            >
              {t("sidebar.recent")}
            </h2>
            {history ?? (
              <p className="px-2 text-xs text-[var(--text-muted)]">
                {t("sidebar.noRecent")}
              </p>
            )}
          </section>

          <section className="mt-3 px-1" aria-labelledby="sidebar-fav-title">
            <h2
              id="sidebar-fav-title"
              className="mb-1.5 px-2 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--text-muted)]"
            >
              {t("sidebar.favorites")}
            </h2>
            {favorites ?? (
              <p className="px-2 text-xs text-[var(--text-muted)]">
                {t("sidebar.noFavorites")}
              </p>
            )}
          </section>
        </nav>

        <div className="shrink-0 p-2 lg:px-[var(--page-gutter)] lg:pb-[var(--page-gutter)] lg:pt-0">
          <div className="glass glass-sm flex items-center gap-2.5 px-2.5 py-2">
            <Navigation
              className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[0.65rem] text-[var(--text-muted)]">
                {t("sidebar.currentPosition")}
              </p>
              <p className="truncate text-xs text-[var(--text-secondary)]">
                {location.displayName}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
