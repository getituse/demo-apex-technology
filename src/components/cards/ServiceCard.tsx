import type { ServiceCardData } from "@/sections/section-types";
import { CardItemList, ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";

export function ServiceCard({ item, ...props }: ContentCardProps<ServiceCardData>) {
  return (
    <ContentCardFrame item={item} {...props}>
      <CardItemList items={item.deliverables} />
    </ContentCardFrame>
  );
}
