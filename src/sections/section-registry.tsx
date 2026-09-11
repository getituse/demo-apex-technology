import type { ComponentType } from "react";
import {
  AnnouncementSection,
  HeroSection,
  AboutSplitSection,
  PrincipalMessageSection,
  LeadershipMessageSection,
  ApplicationCTASection,
  FinalCTASection,
  MapSection,
  NewsletterSection,
} from "./EditorialSections";
import {
  QuickLinksSection,
  TrustStripSection,
  StatsSection,
  ResultsSection,
  MissionVisionSection,
  ValuesSection,
  StepsSection,
  NoticeBoardSection,
  ProgramGridSection,
  ServiceGridSection,
  DepartmentGridSection,
  NewsGridSection,
  EventsGridSection,
  FacilitiesSection,
  FacultyGridSection,
  TeamGridSection,
  TestimonialsSection,
  PlacementsSection,
  ResearchHighlightsSection,
  LifeSection,
  AlumniStoriesSection,
  CaseStudiesSection,
  DownloadsSection,
  FaqSection,
  ContactDetailsSection,
} from "./CollectionSections";
import { ImageGallerySection } from "./ImageGallerySection";
import { EnquiryFormSection } from "./EnquiryFormSection";
import type { SectionComponentProps, SectionType } from "./section-types";

export type SectionRegistry = { [T in SectionType]: ComponentType<SectionComponentProps<T>> };
export const sectionRegistry = {
  announcementBar: AnnouncementSection,
  hero: HeroSection,
  quickLinks: QuickLinksSection,
  trustStrip: TrustStripSection,
  stats: StatsSection,
  aboutSplit: AboutSplitSection,
  missionVision: MissionVisionSection,
  values: ValuesSection,
  principalMessage: PrincipalMessageSection,
  leadershipMessage: LeadershipMessageSection,
  programGrid: ProgramGridSection,
  serviceGrid: ServiceGridSection,
  departmentGrid: DepartmentGridSection,
  admissionsSteps: StepsSection,
  applicationCTA: ApplicationCTASection,
  noticeBoard: NoticeBoardSection,
  newsGrid: NewsGridSection,
  eventsGrid: EventsGridSection,
  results: ResultsSection,
  placements: PlacementsSection,
  researchHighlights: ResearchHighlightsSection,
  facilities: FacilitiesSection,
  campusLife: LifeSection,
  imageGallery: ImageGallerySection,
  facultyGrid: FacultyGridSection,
  teamGrid: TeamGridSection,
  testimonials: TestimonialsSection,
  alumniStories: AlumniStoriesSection,
  caseStudies: CaseStudiesSection,
  downloads: DownloadsSection,
  faq: FaqSection,
  contactDetails: ContactDetailsSection,
  map: MapSection,
  newsletter: NewsletterSection,
  finalCTA: FinalCTASection,
  enquiryForm: EnquiryFormSection,
} satisfies SectionRegistry;

export function isSectionType(value: unknown): value is SectionType {
  return typeof value === "string" && Object.hasOwn(sectionRegistry, value);
}

export function RegisteredSection(props: SectionComponentProps) {
  if (!isSectionType(props.section.type)) {
    if (import.meta.env.DEV)
      console.warn("Unknown section type; no content rendered:", props.section.type);
    return null;
  }
  // The mapped registry enforces that each discriminator accepts its matching props.
  const Component = sectionRegistry[props.section.type] as ComponentType<SectionComponentProps>;
  return <Component {...props} />;
}
