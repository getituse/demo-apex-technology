import type { PersonCardData } from "@/sections/section-types";
import type { ContentCardProps } from "./ContentCardFrame";
import { PersonCardView } from "./PersonCardView";

export function FacultyCard(props: ContentCardProps<PersonCardData>) {
  return <PersonCardView {...props} />;
}
