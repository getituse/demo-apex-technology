import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded border border-dashed border-border bg-surface p-10 text-center",
        className,
      )}
    >
      <p className="font-heading text-h3 text-foreground">{title}</p>
      {description ? <p className="max-w-prose text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}
