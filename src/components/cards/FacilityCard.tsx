import { cn } from "@/lib/cn";
import type { FacilityCardData } from "@/sections/section-types";
import { CardItemList, ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";

export function FacilityCard({ item, className, ...props }: ContentCardProps<FacilityCardData>) {
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
      <CardItemList items={item.features} />
    </ContentCardFrame>
  );
}

