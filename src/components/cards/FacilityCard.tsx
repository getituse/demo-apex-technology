import type { FacilityCardData } from "@/sections/section-types";
import { CardItemList, ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";

export function FacilityCard({ item, ...props }: ContentCardProps<FacilityCardData>) {
  return (
    <ContentCardFrame item={item} {...props}>
      <CardItemList items={item.features} />
    </ContentCardFrame>
  );
}
