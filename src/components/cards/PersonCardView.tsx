import { CardMeta } from "@/components/ui/Card";
import type { PersonCardData } from "@/sections/section-types";
import { CardItemList, ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";

export function PersonCardView({ item, ...props }: ContentCardProps<PersonCardData>) {
  return (
    <ContentCardFrame item={item} {...props} imageAspect="3/4">
      <CardMeta className="font-medium text-card-foreground">{item.role}</CardMeta>
      <CardItemList items={item.credentials} />
    </ContentCardFrame>
  );
}
