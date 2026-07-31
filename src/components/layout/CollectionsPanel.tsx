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
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

export type CollectionsView = "favorites" | "history";

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

/**
 * Compact glass flyout — one list (favorites or history), anchored to its trigger.
 */
export function CollectionsPanel({
  open = false,
  onClose,
  view = "history",
  anchor = null,
  favoritesSlot,
  historySlot,
  className,
}: CollectionsPanelProps) {
  const t = useT();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  const isFavorites = view === "favorites";
  const title = isFavorites ? t("sidebar.favorites") : t("sidebar.recent");
  const content = withCloseOnSelect(
    isFavorites ? favoritesSlot : historySlot,
    onClose,
  );

  useLayoutEffect(() => {
    if (!open || !anchor || !panelRef.current) {
      if (!open) setCoords(null);
      return;
    }

    const panel = panelRef.current;
    const gap = 8;
    const margin = 12;
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = anchor.right + gap;
    let top = anchor.top;

    if (left + pw > vw - margin) {
      left = Math.min(anchor.right - pw, vw - pw - margin);
      top = anchor.bottom + gap;
    }

    left = Math.max(margin, Math.min(left, vw - pw - margin));
    top = Math.max(margin, Math.min(top, vh - ph - margin));

    setCoords({ top, left });
  }, [open, anchor, view]);

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

  return (
    <div
      ref={panelRef}
      id="app-collections-panel"
      tabIndex={-1}
      className={cn(
        "glass-menu fixed z-[60] w-[min(calc(100vw-1.5rem),var(--collections-panel-width))] outline-none",
        "max-h-[min(22rem,calc(100dvh-1.5rem))] px-3 py-3",
        "rounded-[var(--glass-radius)]",
        open && coords
          ? "opacity-100"
          : "pointer-events-none invisible opacity-0",
        className,
      )}
      style={
        coords ? { top: coords.top, left: coords.left } : { top: 0, left: 0 }
      }
      aria-label={title}
      aria-hidden={!open ? true : undefined}
      role={open ? "dialog" : undefined}
    >
      <p className="mb-2 px-1 text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </p>
      <div className="glass-menu-scroll">
        {content ?? (
          <p className="px-1 text-xs text-[var(--text-muted)]">
            {isFavorites ? t("sidebar.noFavorites") : t("sidebar.noRecent")}
          </p>
        )}
      </div>
    </div>
  );
}
