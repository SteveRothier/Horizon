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
import {
  Home,
  Map,
  Star,
  Clock,
  Navigation,
  Settings,
  X,
  ChevronDown,
} from "lucide-react";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/i18n/messages";
import { useLocationStore } from "@/stores/locationStore";
import { cn } from "@/utils/cn";

type ExpandableId = "favorites" | "history" | "settings";

type NavLinkItem = {
  kind: "link";
  id: string;
  labelKey: MessageKey;
  icon: typeof Home;
  href: string;
};

type NavExpandableItem = {
  kind: "expandable";
  id: ExpandableId;
  labelKey: MessageKey;
  icon: typeof Home;
  panelId: string;
};

const NAV_ITEMS: (NavLinkItem | NavExpandableItem)[] = [
  { kind: "link", id: "home", labelKey: "nav.home", icon: Home, href: "#main-content" },
  { kind: "link", id: "map", labelKey: "nav.map", icon: Map, href: "#weather-map" },
  {
    kind: "expandable",
    id: "favorites",
    labelKey: "nav.favorites",
    icon: Star,
    panelId: "sidebar-favorites-panel",
  },
  {
    kind: "expandable",
    id: "history",
    labelKey: "nav.history",
    icon: Clock,
    panelId: "sidebar-history-panel",
  },
  {
    kind: "expandable",
    id: "settings",
    labelKey: "nav.settings",
    icon: Settings,
    panelId: "sidebar-settings-panel",
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
  return "home";
}

/**
 * Left navigation shell — nested disclosures for favorites / history / settings.
 * Mobile: floating glass drawer with Escape close + focus restore.
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
  const [expanded, setExpanded] = useState<ExpandableId | null>(null);
  const location = useLocationStore((s) => s.location);
  const drawerActive = isMobile && open;

  const favorites = withCloseOnSelect(favoritesSlot, onClose);
  const history = withCloseOnSelect(historySlot, onClose);

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

  function toggleExpanded(id: ExpandableId) {
    setExpanded((prev) => (prev === id ? null : id));
    setActiveId(id);
  }

  function navigateTo(href: string, id: string) {
    setExpanded(null);
    setActiveId(id);
    onClose?.();

    const targetId = href.replace(/^#/, "");
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

  function panelContent(id: ExpandableId): ReactNode {
    if (id === "favorites") {
      return (
        favorites ?? (
          <p className="px-2 text-xs text-[var(--text-muted)]">
            {t("sidebar.noFavorites")}
          </p>
        )
      );
    }
    if (id === "history") {
      return (
        history ?? (
          <p className="px-2 text-xs text-[var(--text-muted)]">
            {t("sidebar.noRecent")}
          </p>
        )
      );
    }
    return settingsSlot;
  }

  return (
    <div
      className={cn(
        "max-lg:h-0 max-lg:w-0 max-lg:min-h-0 max-lg:min-w-0 max-lg:shrink-0 max-lg:overflow-visible",
        "lg:h-auto lg:w-[var(--sidebar-width)] lg:shrink-0",
      )}
    >
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        id="app-sidebar"
        className={cn(
          "fixed z-50 flex flex-col",
          "inset-y-3 left-3 w-[min(calc(100%-1.5rem),var(--sidebar-width))]",
          "rounded-[var(--glass-radius)] border border-[var(--glass-border)]",
          "bg-[var(--glass-bg)] shadow-[var(--glass-shadow)]",
          "backdrop-blur-[var(--glass-blur)]",
          "transition-[transform,opacity] duration-300 ease-[var(--ease-out)]",
          "lg:static lg:inset-auto lg:z-0 lg:h-full lg:w-full lg:shrink-0",
          "lg:translate-x-0 lg:self-stretch lg:rounded-none lg:border-0",
          "lg:bg-transparent lg:shadow-none lg:backdrop-blur-none",
          open
            ? "max-lg:translate-x-0 max-lg:opacity-100"
            : "max-lg:-translate-x-[calc(100%+0.75rem)] max-lg:opacity-0 max-lg:pointer-events-none max-lg:invisible",
          "lg:translate-x-0 lg:opacity-100 lg:visible lg:pointer-events-auto",
          className,
        )}
        aria-label={t("nav.main")}
        aria-modal={drawerActive || undefined}
        aria-hidden={isMobile && !open ? true : undefined}
        role={drawerActive ? "dialog" : undefined}
      >
        <div className="flex h-[var(--header-height)] shrink-0 items-center justify-between px-4 lg:hidden">
          <span className="font-[family-name:var(--font-horizon-display)] text-lg font-semibold text-[var(--text-primary)]">
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
            {NAV_ITEMS.map((item) => {
              if (item.kind === "link") {
                const { id, labelKey, icon: Icon, href } = item;
                const active = activeId === id;
                return (
                  <li key={id}>
                    <a
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[var(--glass-radius-sm)] px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-white/15 text-[var(--text-primary)] ring-1 ring-white/25"
                          : "text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]",
                      )}
                      aria-current={active ? "page" : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo(href, id);
                      }}
                    >
                      <Icon
                        className="h-4 w-4 shrink-0 opacity-80"
                        aria-hidden
                      />
                      {t(labelKey)}
                    </a>
                  </li>
                );
              }

              const { id, labelKey, icon: Icon, panelId } = item;
              const isOpen = expanded === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-[var(--glass-radius-sm)] px-2.5 py-2 text-sm transition-colors",
                      isOpen
                        ? "bg-white/15 text-[var(--text-primary)] ring-1 ring-white/25"
                        : "text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]",
                    )}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleExpanded(id)}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    <span className="min-w-0 flex-1 text-left">{t(labelKey)}</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200 ease-[var(--ease-out)]",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>

                  <div
                    id={panelId}
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200 ease-[var(--ease-out)]",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                    aria-hidden={!isOpen}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="px-1 pb-2 pt-1">{panelContent(id)}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
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
