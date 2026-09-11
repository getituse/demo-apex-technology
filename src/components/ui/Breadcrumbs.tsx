import { Link } from "react-router";

import { cn } from "@/lib/cn";

export interface Crumb {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: Crumb[];
  /** Names the landmark when a page has more than one navigation region. */
  label?: string;
  className?: string;
}

/**
 * The last crumb is the current page: plain text, marked `aria-current`, never a link
 * to where the user already is.
 */
export function Breadcrumbs({ items, label = "Breadcrumb", className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="inline-flex min-h-6 items-center text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="text-foreground">
                  {item.label}
                </span>
              )}
              {isLast ? null : (
                <span aria-hidden="true" className="text-muted-foreground">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
