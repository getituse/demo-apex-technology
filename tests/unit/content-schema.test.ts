import { describe, expect, it } from "vitest";

import {
  CONTENT_SCHEMA_KEYS,
  tenantContentSchema,
  type TenantContentInput,
} from "@/config/content-schema";
import { CONTENT_COLLECTIONS } from "@/config/tenant-schema";
import { rawContent as siteContent } from "@/site/content";

function validContent(): TenantContentInput {
  return structuredClone(siteContent);
}

describe("tenantContentSchema", () => {
  it("declares exactly the collections a tenant can configure a source for", () => {
    expect([...CONTENT_SCHEMA_KEYS].sort()).toEqual([...CONTENT_COLLECTIONS].sort());
  });

  it("accepts a valid content set", () => {
    expect(tenantContentSchema.safeParse(validContent()).success).toBe(true);
  });

  it.each(CONTENT_COLLECTIONS)("requires the %s collection to be present", (collection) => {
    const content = validContent() as unknown as Record<string, unknown>;
    delete content[collection];
    expect(tenantContentSchema.safeParse(content).success).toBe(false);
  });

  describe("isDemoContent", () => {
    it.each(["stats", "programs"] as const)(
      "is required on every %s entry that can carry a claim",
      (collection) => {
        const content = validContent();
        for (const item of content[collection]) {
          delete (item as unknown as Record<string, unknown>).isDemoContent;
        }
        expect(tenantContentSchema.safeParse(content).success).toBe(false);
      },
    );

    it("is not silently defaulted to false", () => {
      const content = validContent() as unknown as { stats: Record<string, unknown>[] };
      delete content.stats[0]?.isDemoContent;

      const result = tenantContentSchema.safeParse(content);
      expect(result.success).toBe(false);
    });
  });

  it("rejects duplicate slugs, which would produce duplicate prerender routes", () => {
    const content = validContent();
    const first = content.programs[0];
    const second = content.programs[1];
    if (!first || !second) throw new Error("fixture needs at least two programs");
    second.slug = first.slug;

    const result = tenantContentSchema.safeParse(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("duplicate key"))).toBe(
        true,
      );
    }
  });

  it("rejects a program pointing at an unknown department", () => {
    const content = validContent();
    const first = content.programs[0];
    if (!first) throw new Error("fixture needs at least one program");
    const unknownDepartment = "missing-department-regression-fixture";
    expect(content.departments.some((department) => department.slug === unknownDepartment)).toBe(
      false,
    );
    first.departmentSlug = unknownDepartment;

    const result = tenantContentSchema.safeParse(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["programs"],
            message: `program "${first.slug}" references unknown department "${unknownDepartment}"`,
          }),
        ]),
      );
    }
  });

  it("rejects an event that ends before it starts", () => {
    const content = validContent();
    content.events = [
      {
        slug: "sample-open-morning",
        title: "Sample open morning",
        summary: "A demonstration event entry.",
        body: ["Demonstration content."],
        startsAt: "2026-05-10",
        endsAt: "2026-05-09",
        location: "Main hall",
        isDemoContent: true,
      },
    ];

    expect(tenantContentSchema.safeParse(content).success).toBe(false);
  });
  it("compares timezone offsets as actual instants rather than strings", () => {
    const content = validContent();
    const event = {
      slug: "offset-event",
      title: "Offset event",
      summary: "Example",
      body: ["Example"],
      location: "Online",
      isDemoContent: true,
      startsAt: "2026-09-08T10:00:00+02:00",
      endsAt: "2026-09-08T09:00:00Z",
    };
    content.events = [event];
    expect(tenantContentSchema.safeParse(content).success).toBe(true);
    content.events = [
      { ...event, startsAt: "2026-09-08T10:00:00Z", endsAt: "2026-09-08T11:00:00+02:00" },
    ];
    expect(tenantContentSchema.safeParse(content).success).toBe(false);
  });

  it("rejects body copy containing no paragraphs", () => {
    const content = validContent();
    const first = content.programs[0];
    if (!first) throw new Error("fixture needs at least one program");
    first.body = [];

    expect(tenantContentSchema.safeParse(content).success).toBe(false);
  });
});
