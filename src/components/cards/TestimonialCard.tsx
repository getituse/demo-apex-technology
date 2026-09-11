import { useId } from "react";

import { ResponsiveImage } from "@/components/media/Image";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import type { TestimonialCardData } from "@/sections/section-types";
import { DemoContentLabel, type ContentCardProps } from "./ContentCardFrame";

export function TestimonialCard({
  item,
  demoLabel,
  headingTag = "h3",
}: ContentCardProps<TestimonialCardData>) {
  const titleId = useId();
  return (
    <Card as="article" aria-labelledby={titleId} className="h-full min-w-0 break-words">
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
