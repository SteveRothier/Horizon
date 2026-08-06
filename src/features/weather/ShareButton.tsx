"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Check, Share2 } from "lucide-react";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

type ShareButtonProps = {
  className?: string;
};

const tipEase = [0.22, 1, 0.36, 1] as const;

async function copyUrl(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const input = document.createElement("input");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(input);
    return ok;
  } catch {
    return false;
  }
}

export function ShareButton({ className }: ShareButtonProps) {
  const t = useT();
  const [done, setDone] = useState(false);
  const [tip, setTip] = useState<"copied" | "shared" | null>(null);
  const [bumpKey, setBumpKey] = useState(0);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => {
      setDone(false);
      setTip(null);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [done]);

  async function onShare() {
    const url = window.location.href;
    const title = document.title || "Horizon";

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url, text: title });
        setTip("shared");
        setDone(true);
        setBumpKey((n) => n + 1);
        return;
      } catch (error) {
        // User cancelled share sheet — do not fall through to clipboard.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    const ok = await copyUrl(url);
    if (!ok) return;
    setTip("copied");
    setDone(true);
    setBumpKey((n) => n + 1);
  }

  const tipLabel =
    tip === "shared"
      ? t("share.shared")
      : tip === "copied"
        ? t("share.copied")
        : t("share.label");

  return (
    <div className="relative z-10 flex flex-col items-center overflow-visible">
      <button
        type="button"
        onClick={() => void onShare()}
        className={cn(
          "glass glass-sm flex h-9 w-9 shrink-0 items-center justify-center transition-colors",
          done
            ? "text-[var(--accent)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          className,
        )}
        aria-label={done ? tipLabel : t("share.label")}
        title={done ? tipLabel : t("share.label")}
      >
        <span
          key={bumpKey}
          className={cn("inline-flex", bumpKey > 0 && "action-bounce")}
        >
          {done ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <Share2 className="h-4 w-4" aria-hidden />
          )}
        </span>
      </button>

      <AnimatePresence>
        {done && tip ? (
          <m.span
            key="share-tip"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, x: "-50%", y: -6 }}
            animate={{ opacity: 1, x: "-50%", y: 0 }}
            exit={{ opacity: 0, x: "-50%", y: -4 }}
            transition={{ duration: 0.22, ease: tipEase }}
            className="glass-menu-tip pointer-events-none absolute top-[calc(100%+0.35rem)] left-1/2 z-20 whitespace-nowrap px-2.5 py-1 text-[0.65rem] text-[var(--text-primary)]"
          >
            {tipLabel}
          </m.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
