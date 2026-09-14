import { CardMeta } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { EventCardData } from "@/sections/section-types";
import { ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";
import { formatCardDateTime } from "./card-date";

export function EventCard({ item, className, ...props }: ContentCardProps<EventCardData>) {
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
      meta={
        <CardMeta>
          <time dateTime={item.startsAt}>{formatCardDateTime(item.startsAt)}</time>
        </CardMeta>
      }
    >
      <dl className="text-sm">
        <dt className="font-medium text-card-foreground">Location</dt>
        <dd>{item.location}</dd>
      </dl>
    </ContentCardFrame>
  );
}

