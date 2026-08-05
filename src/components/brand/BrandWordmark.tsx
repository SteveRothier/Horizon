"use client";

import Link from "next/link";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

type BrandWordmarkProps = {
  className?: string;
};

/**
 * Text brand mark — glass pill + scene-tinted gradient (tokens, no JS).
 */
export function BrandWordmark({ className }: BrandWordmarkProps) {
  const t = useT();

  return (
    <Link
      href="/"
      className={cn("brand-wordmark shrink-0", className)}
      aria-label={t("header.brand")}
    >
      <span className="brand-wordmark-text">{t("header.brand")}</span>
    </Link>
  );
}
