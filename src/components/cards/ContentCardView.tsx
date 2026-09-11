import type { ContentCardData } from "@/sections/section-types";
import { ContentCardFrame, type ContentCardProps } from "./ContentCardFrame";

export function ContentCardView(props: ContentCardProps<ContentCardData>) {
  return <ContentCardFrame {...props} />;
}
