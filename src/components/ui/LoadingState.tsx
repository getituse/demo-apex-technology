import { cn } from "@/lib/cn";

export interface LoadingStateProps {
  /** Announced to assistive technology while the region is busy. */
  label: string;
  /** Number of skeleton rows to reserve, so the layout does not jump on load. */
  rows?: number;
  className?: string;
}

export function LoadingState({ label, rows = 3, className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={cn("space-y-3", className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          // Pulse only: no transform, so reduced-motion users get a static block.
          className="h-4 w-full animate-pulse rounded-sm bg-muted motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}
