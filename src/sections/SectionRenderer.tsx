import { useMemo } from "react";
import { RegisteredSection, isSectionType } from "./section-registry";
import { SectionFrame } from "./section-layout";
import { sectionArraySchema, type SectionConfig } from "./section-types";

export interface SectionRendererProps {
  sections: readonly SectionConfig[];
  pageHeadingPresent?: boolean;
}

export function SectionRenderer({ sections, pageHeadingPresent = false }: SectionRendererProps) {
  const parsed = useMemo(
    () =>
      sectionArraySchema.parse(
        sections.filter((section) => {
          const discriminator = section?.type;
          if (isSectionType(discriminator)) return true;
          if (import.meta.env.DEV)
            console.warn("Unknown section type; no content rendered:", discriminator);
          return false;
        }),
      ),
    [sections],
  );
  let headingAssigned = pageHeadingPresent;
  const occurrences = new Map<string, number>();
  return (
    <>
      {parsed
        .filter((section) => section.enabled !== false)
        .map((section, index) => {
          const persistentHeading = section.heading && section.type !== "announcementBar";
          const headingLevel = !headingAssigned && persistentHeading ? "h1" : "h2";
          if (persistentHeading) headingAssigned = true;
          const fingerprint = JSON.stringify(section);
          const occurrence = occurrences.get(fingerprint) ?? 0;
          occurrences.set(fingerprint, occurrence + 1);
          return (
            <SectionFrame
              key={section.id ?? `${fingerprint}-${occurrence}`}
              section={section}
              background={section.background ?? (index % 2 === 0 ? "default" : "tint")}
              isFirst={index === 0}
            >
              <RegisteredSection section={section} headingLevel={headingLevel} />
            </SectionFrame>
          );
        })}
    </>
  );
}
