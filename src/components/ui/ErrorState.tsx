import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface ErrorStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Heading level, so an error inside a page does not introduce a second h1. */
  as?: "h1" | "h2";
  className?: string;
}

export function ErrorState({
  title,
  description,
  action,
  as: Heading = "h2",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded border border-destructive bg-surface p-6",
        className,
      )}
    >
      <Heading className="font-heading text-h3 text-destructive">{title}</Heading>
      {description ? <div className="max-w-prose text-muted-foreground">{description}</div> : null}
      {action}
    </div>
  );
}
