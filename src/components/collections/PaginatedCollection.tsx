import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { fieldControlClasses } from "@/components/ui/FormField";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/cn";

export interface PaginatedCollectionProps<T extends { id: string }> {
  items: readonly T[];
  pageSize: number;
  categoryFiltering: boolean;
  label: string;
  emptyMessage: string;
  variant?: "grid" | "list";
  getCategory: (item: T) => string | undefined;
  renderItem: (item: T) => ReactNode;
}

/**
 * Initial HTML and the first hydration render contain every record, without controls.
 * Enhancement hides (never deletes) off-page cards after mount. This intentionally
 * rearranges below-fold content; crawling and no-script access take precedence.
 * State is per instance, not query-string state, so canonical URLs remain unchanged.
 */
export function PaginatedCollection<T extends { id: string }>({
  items,
  pageSize,
  categoryFiltering,
  label,
  emptyMessage,
  variant,
  getCategory,
  renderItem,
}: PaginatedCollectionProps<T>) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const resultsId = `collection-${id}-results`;
  const statusId = `collection-${id}-status`;
  const selectId = `collection-${id}-category`;
  const resultsRef = useRef<HTMLUListElement>(null);
  const focusPending = useRef(false);
  const [ready, setReady] = useState(false);
  // Compare values, not array identity: a parent's equivalent rerender must not reset paging.
  const datasetKey = JSON.stringify([items, pageSize, categoryFiltering]);
  const [query, setQuery] = useState({ datasetKey, category: "", page: 1 });
  const selectedCategory = categoryFiltering ? query.category : "";
  const categoriesById = new Map(
    items.map((item) => [item.id, getCategory(item) ?? "Uncategorized"]),
  );
  const categories = [...new Set(categoriesById.values())].sort((a, b) => a.localeCompare(b));
  const filtered = items.filter(
    (item) => !selectedCategory || categoriesById.get(item.id) === selectedCategory,
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.max(
    1,
    Math.min(query.datasetKey === datasetKey ? query.page : 1, totalPages),
  );
  const start = (currentPage - 1) * pageSize;
  const visibleIds = new Set(filtered.slice(start, start + pageSize).map((item) => item.id));

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    setQuery((previous) => {
      if (previous.datasetKey !== datasetKey) {
        return { datasetKey, category: categoryFiltering ? previous.category : "", page: 1 };
      }
      return previous.page === currentPage ? previous : { ...previous, page: currentPage };
    });
  }, [datasetKey, categoryFiltering, currentPage]);

  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    resultsRef.current?.focus();
  }, [query, currentPage]);

  function changeCategory(category: string) {
    setQuery({ datasetKey, category, page: 1 });
  }

  function changePage(page: number) {
    focusPending.current = true;
    setQuery({ datasetKey, category: selectedCategory, page });
  }

  const count = ready ? filtered.length : items.length;
  const first = count ? (ready ? start + 1 : 1) : 0;
  const last = ready ? Math.min(start + pageSize, count) : count;

  return (
    <div className="space-y-6">
      {ready && categoryFiltering && (items.length > 0 || selectedCategory) ? (
        <div className="max-w-sm space-y-2">
          <label htmlFor={selectId} className="block font-medium">
            Filter {label} by category
          </label>
          <select
            id={selectId}
            className={fieldControlClasses}
            value={selectedCategory}
            aria-controls={resultsId}
            aria-describedby={statusId}
            onChange={(event) => changeCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {selectedCategory && !categories.includes(selectedCategory) ? (
              <option value={selectedCategory}>{selectedCategory}</option>
            ) : null}
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <p id={statusId} role="status" aria-live="polite" aria-atomic="true" className="text-sm">
        {label}: Showing {first}–{last} of {count} results.
        {ready && selectedCategory ? ` Category: ${selectedCategory}.` : ""}
        {ready && count > 0 ? ` Page ${currentPage} of ${totalPages}.` : ""}
      </p>
      {count === 0 ? (
        <div className="space-y-4 rounded border border-current p-6">
          <p>{ready && selectedCategory ? "No results match this category." : emptyMessage}</p>
          {ready && selectedCategory ? (
            <Button
              variant="outline"
              onClick={() => {
                focusPending.current = true;
                changeCategory("");
              }}
            >
              Clear category filter
            </Button>
          ) : null}
        </div>
      ) : null}
      <ul
        id={resultsId}
        ref={resultsRef}
        tabIndex={-1}
        aria-label={`${label} results`}
        aria-describedby={statusId}
        className={cn(
          "grid min-w-0 gap-6 rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
          variant !== "list" && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {items.map((item) => (
          <li
            key={item.id}
            hidden={ready && !visibleIds.has(item.id)}
            className={cn("min-w-0", ready && !visibleIds.has(item.id) && "hidden")}
          >
            {renderItem(item)}
          </li>
        ))}
      </ul>
      {ready ? (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={changePage}
          label={`${label} pagination`}
        />
      ) : null}
    </div>
  );
}
