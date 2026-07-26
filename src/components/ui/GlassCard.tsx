"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type GlassCardProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: ReactNode;
  /** Smaller radius (20px) */
  size?: "default" | "sm";
  /** Disable hover lift / highlight */
  interactive?: boolean;
  /** Skip enter animation */
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
      <motion.div
        ref={ref}
        initial={animate ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={
          interactive
            ? {
                backgroundColor: "rgba(255,255,255,0.12)",
                transition: { duration: 0.2 },
              }
            : undefined
        }
        className={cn(
          "glass text-[var(--text-primary)]",
          size === "sm" && "glass-sm",
          interactive && "transition-[box-shadow] duration-200 hover:shadow-[var(--glass-shadow-hover)]",
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
