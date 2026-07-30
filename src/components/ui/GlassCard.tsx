"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/utils/cn";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  /** Smaller radius (20px) */
  size?: "default" | "sm";
  /** Disable hover lift / highlight */
  interactive?: boolean;
  /** Kept for API compat — enter animation is CSS-only when true */
  animate?: boolean;
  className?: string;
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    {
      children,
      size = "default",
      interactive = true,
      animate = true,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "glass text-[var(--text-primary)]",
          size === "sm" && "glass-sm",
          animate && "glass-card-enter",
          interactive &&
            "glass-card-interactive transition-[box-shadow,background-color] duration-200 hover:bg-white/12",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
