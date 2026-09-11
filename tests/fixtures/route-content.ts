import type { TenantConfig } from "@/config/tenant-schema";
import { tenantContentSchema, type TenantContent } from "@/config/content-schema";

export interface TenantModule {
  config: TenantConfig;
  content: TenantContent;
}

/** Constructed records exercise escaping and links independently of the authored catalogue. */
export function withDetailContent(tenant: TenantModule): TenantModule {
  return {
    config: structuredClone(tenant.config),
    content: tenantContentSchema.parse({
      ...structuredClone(tenant.content),
      news: [
        {
          slug: "sample-update",
          title: "Sample update",
          excerpt: "A supplied demonstration update.",
          body: ["The complete update body.", "<strong>This stays plain text.</strong>"],
          publishedAt: "2026-09-01",
          category: "Updates",
          isDemoContent: true,
        },
      ],
      events: [
        {
          slug: "sample-session",
          title: "Sample session",
          summary: "A supplied demonstration session.",
          body: ["The complete session information."],
          startsAt: "2026-10-01T10:00:00+01:00",
          endsAt: "2026-10-01T11:00:00+01:00",
          location: "Online",
          registrationUrl: "https://events.example.com/session",
          isDemoContent: true,
        },
      ],
      people: [
        {
          slug: "sample-person",
          name: "Sample person",
          role: "Demonstration instructor",
          bio: ["The complete demonstration biography."],
          credentials: ["Demonstration credential"],
          email: "person@example.com",
          isDemoContent: true,
        },
        ...structuredClone(tenant.content.people).filter(
          (person: { slug: string }) => person.slug !== "sample-person",
        ),
      ],
    }),
  };
}
