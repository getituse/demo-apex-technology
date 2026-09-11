import { useMemo, useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { useTenantConfig } from "@/lib/tenant/TenantProvider";
import { SectionRenderer } from "@/sections/SectionRenderer";
import { SECTION_TYPES, type SectionConfig, type SectionType } from "@/sections/section-types";
import { isSectionType } from "@/sections/section-registry";
import { createSectionExamples } from "./section-examples";

export function SectionPreview() {
  const tenant = useTenantConfig();
  const examples = useMemo(() => createSectionExamples(tenant), [tenant]);
  const [type, setType] = useState<SectionType>("hero");
  const [heroVariant, setHeroVariant] = useState<"split" | "editorial" | "collage">("split");
  const [background, setBackground] = useState<NonNullable<SectionConfig["background"]>>("default");
  const example = examples[type];
  const firstImage = examples.hero.images[0]!;
  const section: SectionConfig =
    example.type === "hero"
      ? {
          ...example,
          background,
          variant: heroVariant,
          images: heroVariant === "collage" ? [firstImage, firstImage, firstImage] : example.images,
        }
      : { ...example, background };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <FormField label="Preview section type" className="w-64">
          <Select
            value={type}
            onValueChange={(value) => {
              if (isSectionType(value)) setType(value);
            }}
            options={SECTION_TYPES.map((value) => ({ value, label: value }))}
          />
        </FormField>
        <FormField label="Hero layout" className="w-48">
          <Select
            value={heroVariant}
            onValueChange={(value) => {
              if (value === "split" || value === "editorial" || value === "collage")
                setHeroVariant(value);
            }}
            options={["split", "editorial", "collage"].map((value) => ({ value, label: value }))}
          />
        </FormField>
        <FormField label="Section background" className="w-48">
          <Select
            value={background}
            onValueChange={(value) => {
              if (
                value === "default" ||
                value === "muted" ||
                value === "tint" ||
                value === "inverted"
              )
                setBackground(value);
            }}
            options={["default", "muted", "tint", "inverted"].map((value) => ({
              value,
              label: value,
            }))}
          />
        </FormField>
      </div>
      <div className="overflow-hidden rounded border border-border" data-section-preview>
        <SectionRenderer
          key={`${type}-${heroVariant}-${background}`}
          sections={[section]}
          pageHeadingPresent
        />
      </div>
    </div>
  );
}
