import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface SectionHeaderProps {
  /** Rendered as h2 by default; pages with no other h1 can pass "h1". */
  as?: "h1" | "h2" | "h3";
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "start" | "center";
  actions?: ReactNode;
  id?: string;
  className?: string;
}

export function SectionHeader({
  as: Heading = "h2",
  eyebrow,
  title,
  description,
  align = "start",
  actions,
  id,
  className,
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        centered && "sm:flex-col sm:items-center",
        className,
      )}
    >
      <div className={cn("max-w-prose", centered && "text-center")}>
        {eyebrow ? (
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
        ) : null}
        <Heading id={id} className="font-heading text-h2 text-foreground">
          {title}
        </Heading>
        {description ? <p className="mt-3 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
