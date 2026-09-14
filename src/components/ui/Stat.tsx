import { cn } from "@/lib/cn";
import { RunningNumber } from "./RunningNumber";

export interface StatProps {
  label: string;
  value: string;
  caption?: string;
  /**
   * Sample figures must say so. Section 17 of the brief forbids unlabelled demonstration
   * statistics, and the content schema makes the flag required, so a caller cannot forget.
   */
  isDemoContent: boolean;
  demoLabel?: string;
  className?: string;
}

export function Stat({
  label,
  value,
  caption,
  isDemoContent,
  demoLabel = "Sample figure",
  className,
}: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p className="font-heading text-h2 text-primary tabular-nums">
        <RunningNumber value={value} />
      </p>
      <p className="font-medium text-foreground">{label}</p>
      {caption ? <p className="text-sm text-muted-foreground">{caption}</p> : null}
      {isDemoContent ? <p className="text-sm italic text-muted-foreground">{demoLabel}</p> : null}
    </div>
  );
}
