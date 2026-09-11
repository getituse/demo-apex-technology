import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const noticeVariants = cva("rounded border p-4", {
  variants: {
    tone: {
      info: "border-border bg-surface text-foreground",
      success: "border-success bg-surface text-foreground",
      warning: "border-warning bg-surface text-foreground",
      destructive: "border-destructive bg-surface text-foreground",
    },
  },
  defaultVariants: { tone: "info" },
});

const titleTone = {
  info: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
} as const;

export interface NoticeProps extends VariantProps<typeof noticeVariants> {
  title?: string;
  children?: ReactNode;
  /** Errors are announced assertively; everything else politely. */
  live?: boolean;
  className?: string;
}

export function Notice({ tone = "info", title, children, live, className }: NoticeProps) {
  const resolvedTone = tone ?? "info";
  const isAlert = resolvedTone === "destructive";

  return (
    <div
      className={cn(noticeVariants({ tone: resolvedTone }), className)}
      role={live ? (isAlert ? "alert" : "status") : undefined}
      aria-live={live ? (isAlert ? "assertive" : "polite") : undefined}
    >
      {title ? <p className={cn("font-medium", titleTone[resolvedTone])}>{title}</p> : null}
      {children ? <div className="text-sm text-muted-foreground">{children}</div> : null}
    </div>
  );
}
