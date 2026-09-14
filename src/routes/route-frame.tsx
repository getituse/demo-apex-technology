import type { ReactNode } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkButton } from "@/components/ui/LinkButton";
import { Notice } from "@/components/ui/Notice";
import { Section } from "@/components/ui/Section";
import { useTenantConfig } from "@/lib/tenant/TenantProvider";
import type { PublicRoute } from "./route-manifest";

export interface PageFrameProps {
  entry: PublicRoute;
  children: ReactNode;
  hideHeading?: boolean;
  fullBleed?: boolean;
}

export function PageFrame({
  entry,
  children,
  hideHeading = false,
  fullBleed = false,
}: PageFrameProps) {
  const config = useTenantConfig();
  const parent = config.pages[entry.pageId];
  const headingHidden = hideHeading && entry.kind === "page";
  const hasBreadcrumbs =
    (entry.kind === "detail" || config.features.breadcrumbs) && entry.path !== "/";
  const hasHeading = !headingHidden;
  const hasNotice = Boolean(config.legal.demoContentNotice);
  const hasHeader = hasBreadcrumbs || hasHeading || hasNotice;

  const header = hasHeader ? (
    <header className="space-y-4">
      {hasBreadcrumbs ? (
        <Breadcrumbs
          items={[
            { label: config.pages.home.navLabel, href: config.pages.home.path },
            ...(entry.kind === "detail" ? [{ label: parent.navLabel, href: parent.path }] : []),
            { label: entry.title },
          ]}
        />
      ) : null}
      {hasHeading ? (
        <div className="max-w-prose space-y-4">
          <p className="font-medium text-primary">{config.brand.shortName}</p>
          <h1 className="font-heading text-h1">{entry.title}</h1>
          {entry.pageId === "home" ? (
            <p className="text-h3 text-muted-foreground">{config.brand.tagline}</p>
          ) : null}
        </div>
      ) : null}
      {hasNotice ? (
        <Notice title="Demonstration content">{config.legal.demoContentNotice}</Notice>
      ) : null}
    </header>
  ) : null;

  // SectionRenderer owns the body bands and their containers; do not nest them
  // inside another constrained container. Detail records retain their original width.
  if (fullBleed && entry.kind === "page") {
    return (
      <>
        {header ? (
          <Section
            density={headingHidden ? "none" : "default"}
            className={headingHidden ? "pt-3 pb-0 sm:pt-4 sm:pb-1" : undefined}
          >
            <Container>{header}</Container>
          </Section>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <Section>
      <Container className="space-y-6">
        {header}
        {children}
      </Container>
    </Section>
  );
}

export function ContentBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="font-heading text-h2">{title}</h2>
      {children}
    </section>
  );
}

export function Unavailable({ title, description }: { title: string; description?: string }) {
  return (
    <EmptyState
      title={`${title} — not yet available`}
      description={description ?? "No content has been supplied for this page yet."}
    />
  );
}

export function Paragraphs({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div className="max-w-prose space-y-4 text-muted-foreground">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}

export function NotFoundPage() {
  const config = useTenantConfig();
  return (
    <Section>
      <Container>
        <ErrorState
          as="h1"
          title="404 — Page not found"
          description="This page is not available. It may be disabled or the address may be incorrect."
          action={
            <LinkButton href={config.pages.home.path}>{config.pages.home.navLabel}</LinkButton>
          }
        />
      </Container>
    </Section>
  );
}

export function PageErrorBoundary() {
  const error = useRouteError();
  const config = useTenantConfig();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  return (
    <Section>
      <Container>
        <ErrorState
          as="h1"
          title="Unable to display this page"
          description="Please return to the home page or use the listed contact details."
          action={
            <LinkButton href={config.pages.home.path}>{config.pages.home.navLabel}</LinkButton>
          }
        />
      </Container>
    </Section>
  );
}
