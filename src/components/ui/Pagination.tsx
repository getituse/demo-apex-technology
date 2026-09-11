import { Link } from "react-router";

import { cn } from "@/lib/cn";

interface PaginationBaseProps {
  currentPage: number;
  totalPages: number;
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
}

export type PaginationProps = PaginationBaseProps &
  (
    | {
        /** Builds navigable URLs when no local-state callback is supplied. */
        buildHref: (page: number) => string;
        onPageChange?: undefined;
      }
    | {
        /** Uses buttons for local state rather than advertising navigable URLs. */
        onPageChange: (page: number) => void;
        buildHref?: (page: number) => string;
      }
  );

const controlClasses =
  "inline-flex h-11 min-w-11 items-center justify-center rounded border border-input px-3 text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2";

const disabledClasses =
  "inline-flex h-11 min-w-11 items-center justify-center rounded border border-border bg-surface px-3 text-muted-foreground";

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  onPageChange,
  label = "Pagination",
  previousLabel = "Previous",
  nextLabel = "Next",
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  function renderControl(page: number, text: string | number, rel?: "prev" | "next") {
    return onPageChange ? (
      <button type="button" onClick={() => onPageChange(page)} className={controlClasses}>
        {text}
      </button>
    ) : (
      <Link to={buildHref(page)} className={controlClasses} rel={rel}>
        {text}
      </Link>
    );
  }

  return (
    <nav aria-label={label} className={cn("flex flex-wrap items-center gap-2", className)}>
      {hasPrevious ? (
        renderControl(currentPage - 1, previousLabel, "prev")
      ) : (
        // Rendered but inert, so the control does not move as you page through.
        <span className={disabledClasses} aria-hidden="true">
          {previousLabel}
        </span>
      )}

      <ol className="flex flex-wrap items-center gap-2">
        {pages.map((page) => (
          <li key={page}>
            {page === currentPage ? (
              <span
                aria-current="page"
                className="inline-flex h-11 min-w-11 items-center justify-center rounded bg-primary px-3 font-medium text-primary-foreground"
              >
                {page}
              </span>
            ) : (
              renderControl(page, page)
            )}
          </li>
        ))}
      </ol>

      {hasNext ? (
        renderControl(currentPage + 1, nextLabel, "next")
      ) : (
        <span className={disabledClasses} aria-hidden="true">
          {nextLabel}
        </span>
      )}
    </nav>
  );
}
