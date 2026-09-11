import { CardMeta } from "@/components/ui/Card";
import type { EventCardData } from "@/sections/section-types";
import { ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";
import { formatCardDateTime } from "./card-date";

export function EventCard({ item, ...props }: ContentCardProps<EventCardData>) {
  return (
    <ContentCardFrame
      item={item}
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
