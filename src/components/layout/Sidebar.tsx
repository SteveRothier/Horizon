"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Home, Map, Star, Clock, Navigation, Settings, X } from "lucide-react";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/i18n/messages";
import { useLocationStore } from "@/stores/locationStore";
import { cn } from "@/utils/cn";

const NAV_ITEMS: {
  id: string;
  labelKey: MessageKey;
  icon: typeof Home;
  href: string;
}[] = [
  { id: "home", labelKey: "nav.home", icon: Home, href: "#main-content" },
  { id: "map", labelKey: "nav.map", icon: Map, href: "#weather-map" },
  {
    id: "favorites",
    labelKey: "nav.favorites",
    icon: Star,
    href: "#sidebar-fav-title",
  },
  {
    id: "history",
    labelKey: "nav.history",
    icon: Clock,
    href: "#sidebar-history-title",
  },
  {
    id: "settings",
    labelKey: "nav.settings",
    icon: Settings,
    href: "#sidebar-settings-title",
  },
];

type SlotWithSelect = {
  onSelect?: () => void;
};

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  favoritesSlot?: ReactNode;
  historySlot?: ReactNode;
  settingsSlot?: ReactNode;
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

function activeNavIdFromHash(hash: string): string {
  if (hash === "#weather-map") return "map";
  if (hash === "#sidebar-fav-title") return "favorites";
  if (hash === "#sidebar-history-title") return "history";
  if (hash === "#sidebar-settings-title") return "settings";
  return "home";
}

/**
 * Left navigation shell — glass panels with favorites / history slots.
 * Mobile: drawer with Escape close + focus restore.
 */
export function Sidebar({
  open = false,
  onClose,
  favoritesSlot,
  historySlot,
  settingsSlot,
  className,
}: SidebarProps) {
  const t = useT();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeId, setActiveId] = useState("home");
  const location = useLocationStore((s) => s.location);
  const history = withCloseOnSelect(historySlot, onClose);
  const favorites = withCloseOnSelect(favoritesSlot, onClose);
  const drawerActive = isMobile && open;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    function sync() {
      setIsMobile(mq.matches);
    }
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    function syncHash() {
      setActiveId(activeNavIdFromHash(window.location.hash));
    }
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (!drawerActive) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [drawerActive, onClose]);

  function navigateTo(href: string, id: string) {
    setActiveId(id);
    onClose?.();

    const targetId = href.replace(/^#/, "");
    // Defer until drawer close animation / layout settle
    requestAnimationFrame(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (el instanceof HTMLElement && el.tabIndex < 0) {
          el.tabIndex = -1;
        }
        el.focus?.({ preventScroll: true });
      }
      if (href !== "#main-content") {
        window.history.replaceState(null, "", href);
      } else {
        window.history.replaceState(null, "", window.location.pathname);
      }
    });
  }

  return (
    <div
      className={cn(
        "max-lg:w-0 max-lg:min-w-0 max-lg:shrink-0 max-lg:overflow-visible",
        "lg:w-[var(--sidebar-width)] lg:shrink-0",
      )}
    >
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(100%,var(--sidebar-width))] flex-col",
          "bg-[rgba(14,22,34,0.92)] max-lg:shadow-xl",
          "lg:bg-white/[0.06] lg:backdrop-blur-[var(--glass-blur)]",
          "transition-transform duration-300 ease-[var(--ease-out)]",
          "lg:static lg:z-0 lg:h-full lg:w-full lg:shrink-0 lg:translate-x-0 lg:self-stretch lg:bg-transparent lg:shadow-none lg:backdrop-blur-none",
          open
            ? "translate-x-0"
            : "-translate-x-full max-lg:invisible max-lg:pointer-events-none",
          className,
        )}
        aria-label={t("nav.main")}
        aria-modal={drawerActive || undefined}
        aria-hidden={isMobile && !open ? true : undefined}
        role={drawerActive ? "dialog" : undefined}
      >
        <div className="flex h-[var(--header-height)] items-center justify-between px-4 lg:hidden">
          <span className="font-[family-name:var(--font-horizon-display)] text-lg font-semibold">
            {t("header.brand")}
          </span>
          <button
            ref={closeRef}
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
            {NAV_ITEMS.map(({ id, labelKey, icon: Icon, href }) => {
              const active = activeId === id;
              return (
                <li key={id}>
                  <a
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[var(--glass-radius-sm)] px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-white/15 text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]",
                    )}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(href, id);
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    {t(labelKey)}
                  </a>
                </li>
              );
            })}
          </ul>

          <section
            className="mt-4 px-1"
            aria-labelledby="sidebar-history-title"
          >
            <h2
              id="sidebar-history-title"
              tabIndex={-1}
              className="mb-1.5 px-2 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--text-muted)] outline-none"
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
              tabIndex={-1}
              className="mb-1.5 px-2 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--text-muted)] outline-none"
            >
              {t("sidebar.favorites")}
            </h2>
            {favorites ?? (
              <p className="px-2 text-xs text-[var(--text-muted)]">
                {t("sidebar.noFavorites")}
              </p>
            )}
          </section>

          <section
            className="mt-3 px-1"
            aria-labelledby="sidebar-settings-title"
          >
            <h2
              id="sidebar-settings-title"
              tabIndex={-1}
              className="mb-1.5 px-2 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--text-muted)] outline-none"
            >
              {t("sidebar.settings")}
            </h2>
            {settingsSlot}
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
    </div>
  );
}
