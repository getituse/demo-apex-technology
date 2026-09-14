import { useLocation } from "react-router";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { SectionRenderer } from "@/sections/SectionRenderer";
import { DetailPage } from "./detail-content";
import { resolvePageSections } from "./page-sections";
import { NotFoundPage, PageFrame, Unavailable } from "./route-frame";
import { createRouteManifest, findPublicRoute } from "./route-manifest";

/** Production core routes always pass their serialized loader snapshot. */
export function CorePage({ referenceTime }: { referenceTime: string }) {
  const { config, content } = useTenant();
  const { pathname } = useLocation();
  const entry = findPublicRoute(createRouteManifest(config, content), pathname);
  if (entry?.kind !== "page") return <NotFoundPage />;

  const sections = resolvePageSections(config, content, entry.pageId, referenceTime);
  const activeSections = sections.filter((section) => section.enabled !== false);
  // Match SectionRenderer: a dismissible announcement cannot own the route H1.
  const sectionOwnsHeading =
    activeSections.some((section) => section.heading && section.type !== "announcementBar");

  return (
    <PageFrame entry={entry} hideHeading={sectionOwnsHeading} fullBleed>
      {activeSections.length ? (
        <SectionRenderer sections={sections} pageHeadingPresent={!sectionOwnsHeading} />
      ) : (
        <Section>
          <Container>
            <Unavailable title={entry.title} />
          </Container>
        </Section>
      )}
    </PageFrame>
  );
}

/**
 * Declarative-router compatibility for component consumers, including detail URLs.
 * The production core module imports only CorePage so this detail path can tree-shake.
 * Both branches are eager: primary HTML never depends on Suspense or a client effect.
 */
export function TenantPage({ referenceTime }: { referenceTime?: string }) {
  const { config, content } = useTenant();
  const { pathname } = useLocation();
  const entry = findPublicRoute(createRouteManifest(config, content), pathname);
  if (!entry) return <NotFoundPage />;
  return entry.kind === "detail" ? (
    <DetailPage />
  ) : (
    <CorePage referenceTime={referenceTime ?? new Date().toISOString()} />
  );
}
