import { cn } from "@/lib/cn";
import type { DepartmentCardData } from "@/sections/section-types";
import { ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";

export function DepartmentCard({ item, className, ...props }: ContentCardProps<DepartmentCardData>) {
  return (
    <ContentCardFrame
      item={item}
      className={cn(
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30",
        "motion-reduce:transform-none motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      {item.lead ? (
        <dl className="text-sm">
          <dt className="font-medium text-card-foreground">Lead</dt>
          <dd>{item.lead}</dd>
        </dl>
      ) : null}
    </ContentCardFrame>
  );
}

