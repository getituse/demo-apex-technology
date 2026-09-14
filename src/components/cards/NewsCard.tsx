import { CardMeta } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { NewsCardData } from "@/sections/section-types";
import { ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";
import { formatCardDate } from "./card-date";

export function NewsCard({ item, className, ...props }: ContentCardProps<NewsCardData>) {
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
          <span>{item.category}</span>
          <span aria-hidden="true"> · </span>
          <time dateTime={item.date}>{formatCardDate(item.date)}</time>
        </CardMeta>
      }
    />
  );
}

