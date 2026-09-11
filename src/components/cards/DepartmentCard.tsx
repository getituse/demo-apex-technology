import type { DepartmentCardData } from "@/sections/section-types";
import { ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";

export function DepartmentCard({ item, ...props }: ContentCardProps<DepartmentCardData>) {
  return (
    <ContentCardFrame item={item} {...props}>
      {item.lead ? (
        <dl className="text-sm">
          <dt className="font-medium text-card-foreground">Lead</dt>
          <dd>{item.lead}</dd>
        </dl>
      ) : null}
    </ContentCardFrame>
  );
}
