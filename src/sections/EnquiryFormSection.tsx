import { ConfiguredForm } from "@/components/forms/ConfiguredForm";
import { SectionIntro } from "./section-layout";
import type { SectionComponentProps } from "./section-types";

export function EnquiryFormSection({
  section,
  headingLevel,
}: SectionComponentProps<"enquiryForm">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionIntro section={section} headingLevel={headingLevel} />
      <ConfiguredForm formId={section.formId} label={section.heading} />
    </div>
  );
}
