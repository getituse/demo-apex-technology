import { useId } from "react";

import { ResponsiveImage } from "@/components/media/Image";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { TestimonialCardData } from "@/sections/section-types";
import { DemoContentLabel, type ContentCardProps } from "./ContentCardFrame";

export function TestimonialCard({
  item,
  demoLabel,
  headingTag = "h3",
  className,
}: ContentCardProps<TestimonialCardData>) {
  const titleId = useId();
  return (
    <Card
      as="article"
      aria-labelledby={titleId}
      className={cn(
        "h-full min-w-0 break-words",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30",
        "motion-reduce:transform-none motion-reduce:transition-none",
        className,
      )}
    >
      <figure className="flex h-full flex-col gap-4">
        {item.isDemoContent ? <DemoContentLabel label={demoLabel} /> : null}
        <blockquote className="font-heading text-lg text-card-foreground">
          <p>{item.quote}</p>
        </blockquote>
        <figcaption className="mt-auto flex items-center gap-3">
          {item.image ? (
            <ResponsiveImage {...item.image} aspect="1/1" className="w-16 shrink-0 rounded-full" />
          ) : null}
          <div className="min-w-0">
            <CardTitle id={titleId} as={headingTag}>
              {item.author}
            </CardTitle>
            <CardMeta>{item.role}</CardMeta>
          </div>
        </figcaption>
      </figure>
    </Card>
  );
}
