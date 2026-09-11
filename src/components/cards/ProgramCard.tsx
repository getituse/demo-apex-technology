import type { ProgramCardData } from "@/sections/section-types";
import { CardItemList, ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";

export function ProgramCard({ item, ...props }: ContentCardProps<ProgramCardData>) {
  return (
    <ContentCardFrame item={item} {...props}>
      {item.duration || item.level ? (
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {item.duration ? (
            <div>
              <dt className="font-medium text-card-foreground">Duration</dt>
              <dd>{item.duration}</dd>
            </div>
          ) : null}
          {item.level ? (
            <div>
              <dt className="font-medium text-card-foreground">Level</dt>
              <dd>{item.level}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <CardItemList items={item.highlights ?? []} />
    </ContentCardFrame>
  );
}
