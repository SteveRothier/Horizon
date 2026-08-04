"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Clock, Settings, Star } from "lucide-react";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

export type CollectionsView = "favorites" | "history" | "settings";

export type CollectionsAnchor = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type SlotWithSelect = {
  onSelect?: () => void;
};

type CollectionsPanelProps = {
  open?: boolean;
  onClose?: () => void;
  view?: CollectionsView;
  anchor?: CollectionsAnchor | null;
  favoritesSlot?: ReactNode;
  historySlot?: ReactNode;
  settingsSlot?: ReactNode;
  className?: string;
};

const PANEL_MS = 200;
/** Keep in sync with --collections-panel-width (16rem). */
const PANEL_WIDTH_PX = 256;

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

function rectFromElement(el: Element): CollectionsAnchor {
  const r = el.getBoundingClientRect();
  return {
    top: r.top,
    left: r.left,
    right: r.right,
    bottom: r.bottom,
    width: r.width,
    height: r.height,
  };
}

export function anchorFromEventTarget(
  target: EventTarget | null,
): CollectionsAnchor | null {
  if (!(target instanceof Element)) return null;
  const trigger = target.closest(
    "[data-collections-trigger], [aria-controls='app-collections-panel']",
  );
  return trigger ? rectFromElement(trigger) : rectFromElement(target);
}

function placeUnderIcon(
  anchor: CollectionsAnchor,
  panelHeight: number,
): { top: number; left: number } {
  const gap = 6;
  const margin = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(PANEL_WIDTH_PX, vw - margin * 2);

  let left = anchor.right - width;
  let top = anchor.bottom + gap;

  left = Math.max(margin, Math.min(left, vw - width - margin));
  if (top + panelHeight > vh - margin) {
    top = Math.max(margin, anchor.top - gap - panelHeight);
  }

  return { top, left };
}

/**
 * Compact glass flyout — favorites, history, or settings, under its trigger icon.
 */
export function CollectionsPanel({
  open = false,
  onClose,
  view = "history",
  anchor = null,
  favoritesSlot,
  historySlot,
  settingsSlot,
  className,
}: CollectionsPanelProps) {
  const t = useT();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"in" | "out">("in");

  const title =
    view === "favorites"
      ? t("sidebar.favorites")
      : view === "settings"
        ? t("nav.settings")
        : t("sidebar.recent");

  const TitleIcon =
    view === "favorites" ? Star : view === "settings" ? Settings : Clock;

  const listSlot =
    view === "favorites"
      ? favoritesSlot
      : view === "history"
        ? historySlot
        : null;

  const content =
    view === "settings"
      ? settingsSlot
      : withCloseOnSelect(listSlot, onClose);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      setMounted(true);
      setPhase("in");
      return;
    }
    if (!wasOpenRef.current) return;
    setPhase("out");
  }, [open]);

  useEffect(() => {
    if (open || phase !== "out") return;
    const timer = window.setTimeout(() => {
      setMounted(false);
      setCoords(null);
    }, PANEL_MS);
    return () => window.clearTimeout(timer);
  }, [open, phase]);

  useLayoutEffect(() => {
    if (!mounted || !anchor) return;

    const height = panelRef.current?.offsetHeight ?? 240;
    setCoords(placeUnderIcon(anchor, height));
  }, [mounted, open, anchor, view]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    }

    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!target || !panelRef.current) return;
      if (panelRef.current.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest(
          "[data-collections-trigger], [aria-controls='app-collections-panel']",
        )
      ) {
        return;
      }
      onClose?.();
    }

    function onResize() {
      onClose?.();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("resize", onResize);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      ref={panelRef}
      id="app-collections-panel"
      tabIndex={-1}
      className={cn(
        "glass-menu fixed z-[60] w-[min(calc(100vw-1.5rem),var(--collections-panel-width))] outline-none",
        "max-h-[min(22rem,calc(100dvh-1.5rem))]",
        phase === "out" && "glass-menu-out",
        !coords && "pointer-events-none opacity-0 [animation:none]",
        className,
      )}
      style={
        coords ? { top: coords.top, left: coords.left } : { top: 0, left: 0 }
      }
      aria-label={title}
      aria-hidden={!open ? true : undefined}
      role={open ? "dialog" : undefined}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <TitleIcon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            view === "favorites"
              ? "fill-current text-[var(--accent)]"
              : "text-[var(--text-muted)]",
          )}
          aria-hidden
        />
        <p className="text-xs font-semibold tracking-wide text-[var(--text-primary)]">
          {title}
        </p>
      </div>
      <div
        className={cn(
          "p-1.5",
          view !== "settings" && "glass-menu-scroll",
        )}
      >
        {content ?? (
          <p className="px-2.5 py-2 text-sm text-[var(--text-muted)]">
            {view === "favorites"
              ? t("sidebar.noFavorites")
              : view === "history"
                ? t("sidebar.noRecent")
                : null}
          </p>
        )}
      </div>
    </div>
  );
}
