import { CardMeta } from "@/components/ui/Card";
import type { NewsCardData } from "@/sections/section-types";
import { ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";
import { formatCardDate } from "./card-date";

export function NewsCard({ item, ...props }: ContentCardProps<NewsCardData>) {
  return (
    <ContentCardFrame
      item={item}
      {...props}
      meta={
        <CardMeta>
          <span>{item.category}</span>
          <span aria-hidden="true"> · </span>
          <time dateTime={item.date}>{formatCardDate(item.date)}</time>
        </CardMeta>
      }
    />
  );
}
