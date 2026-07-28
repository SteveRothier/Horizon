"use client";

import { useCallback, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { GlassToast } from "@/components/ui/GlassToast";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

type ShareButtonProps = {
  className?: string;
};

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
  const [copied, setCopied] = useState(false);

  const dismissToast = useCallback(() => setCopied(false), []);

  async function onShare() {
    const url = window.location.href;
    const ok = await copyUrl(url);
    if (ok) setCopied(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={onShare}
        className={cn(
          "glass glass-sm flex h-9 w-9 shrink-0 items-center justify-center transition-colors",
          copied
            ? "text-[var(--accent)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          className,
        )}
        aria-label={copied ? t("share.copied") : t("share.label")}
        title={copied ? t("share.copied") : t("share.label")}
      >
        {copied ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden />
        )}
      </button>
      <GlassToast
        open={copied}
        message={t("share.copied")}
        onClose={dismissToast}
      />
    </>
  );
}
