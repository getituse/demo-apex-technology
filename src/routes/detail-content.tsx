import { useLocation } from "react-router";

import { ResponsiveImage } from "@/components/media/Image";
import { Card, CardLink, CardTitle } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { Notice } from "@/components/ui/Notice";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { ContentBlock, NotFoundPage, PageFrame, Paragraphs, Unavailable } from "./route-frame";
import {
  collectionRoutes,
  createRouteManifest,
  findPublicRoute,
  type DetailRoute,
  type PublicRoute,
} from "./route-manifest";

function DetailCards({ title, entries }: { title: string; entries: readonly DetailRoute[] }) {
  return (
    <ContentBlock title={title}>
      {entries.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Card key={entry.path} as="article" interactive padding="lg">
              <CardTitle>
                <CardLink href={entry.path}>{entry.title}</CardLink>
              </CardTitle>
              <p className="mt-3 text-muted-foreground">{entry.description}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Unavailable title={title} />
      )}
    </ContentBlock>
  );
}

/** Rich record bodies stay eager and separate from configurable listing sections. */
export function DetailContent({
  entry,
  routes,
}: {
  entry: DetailRoute;
  routes: readonly PublicRoute[];
}) {
  const { config, content } = useTenant();
  const item = content[entry.collection].find((candidate) => candidate.slug === entry.slug);
  if (!item) return <Unavailable title={entry.title} />;
  const department =
    "departmentSlug" in item
      ? collectionRoutes(routes, "departments").find(
          (candidate) => candidate.slug === item.departmentSlug,
        )
      : undefined;
  const lead =
    "leadPersonSlug" in item
      ? collectionRoutes(routes, "people").find(
          (candidate) => candidate.slug === item.leadPersonSlug,
        )
      : undefined;
  const relatedPrograms =
    entry.collection === "departments"
      ? collectionRoutes(routes, "programs").filter((candidate) =>
          content.programs.some(
            (program) => program.slug === candidate.slug && program.departmentSlug === entry.slug,
          ),
        )
      : [];
  const relatedCollection =
    entry.collection === "news" || entry.collection === "events" ? entry.collection : undefined;
  const category = "category" in item ? item.category : undefined;
  const relatedItems = relatedCollection
    ? collectionRoutes(routes, relatedCollection)
        .filter((candidate) => candidate.slug !== entry.slug)
        .map((candidate) => ({
          entry: candidate,
          item: content[relatedCollection].find((record) => record.slug === candidate.slug),
        }))
        .filter((candidate) => candidate.item !== undefined)
        .sort((left, right) => {
          const sameCategory = (record: typeof left.item) =>
            Boolean(category && record && "category" in record && record.category === category);
          return Number(sameCategory(right.item)) - Number(sameCategory(left.item));
        })
        .slice(0, 3)
        .map((candidate) => candidate.entry)
    : [];
  return (
    <article className="space-y-6">
      <p className="max-w-prose text-h3 text-muted-foreground">{entry.description}</p>
      {item.isDemoContent ? (
        <p className="text-sm text-muted-foreground">
          Demonstration content — not a verified offering or claim.
        </p>
      ) : null}
      {item.image ? (
        <ResponsiveImage {...item.image} className="max-w-3xl rounded border border-border" />
      ) : null}
      {"publishedAt" in item ? (
        <p>
          {item.category} · <time dateTime={item.publishedAt}>{item.publishedAt}</time>
        </p>
      ) : null}
      {"startsAt" in item ? (
        <dl className="space-y-3">
          <div>
            <dt className="font-medium">Starts</dt>
            <dd>
              <time dateTime={item.startsAt}>{item.startsAt}</time>
            </dd>
          </div>
          {item.endsAt ? (
            <div>
              <dt className="font-medium">Ends</dt>
              <dd>
                <time dateTime={item.endsAt}>{item.endsAt}</time>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="font-medium">Location</dt>
            <dd>{item.location}</dd>
          </div>
        </dl>
      ) : null}
      {"highlights" in item ? (
        <>
          <dl className="flex flex-wrap gap-6">
            {item.levelLabel ? (
              <div>
                <dt className="font-medium">Level</dt>
                <dd>{item.levelLabel}</dd>
              </div>
            ) : null}
            {item.durationLabel ? (
              <div>
                <dt className="font-medium">Duration</dt>
                <dd>{item.durationLabel}</dd>
              </div>
            ) : null}
          </dl>
          <ContentBlock title="Highlights">
            <ul className="list-disc space-y-2 pl-5">
              {item.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </ContentBlock>
        </>
      ) : null}
      <Paragraphs paragraphs={"bio" in item ? item.bio : item.body} />
      {"credentials" in item && item.credentials.length ? (
        <ContentBlock title="Credentials">
          <ul className="list-disc space-y-2 pl-5">
            {item.credentials.map((credential) => (
              <li key={credential}>{credential}</li>
            ))}
          </ul>
        </ContentBlock>
      ) : null}
      {"email" in item && item.email ? (
        <a className="text-primary underline" href={`mailto:${item.email}`}>
          {item.email}
        </a>
      ) : null}
      {"registrationUrl" in item && item.registrationUrl ? (
        <LinkButton href={item.registrationUrl} isExternal>
          Registration information (external)
        </LinkButton>
      ) : null}
      {department ? (
        <DetailCards title={config.terminology.departmentSingular} entries={[department]} />
      ) : null}
      {lead ? <DetailCards title={config.terminology.peopleSectionLabel} entries={[lead]} /> : null}
      {relatedPrograms.length ? (
        <DetailCards title={config.terminology.programPlural} entries={relatedPrograms} />
      ) : null}
      {relatedItems.length ? (
        <DetailCards
          title={relatedCollection === "news" ? "Related news" : "Related events"}
          entries={relatedItems}
        />
      ) : null}
      {entry.collection === "programs" ? (
        <Notice title="Additional information">
          Entry requirements, fees and application deadlines have not been supplied for this
          listing. This page does not submit enquiries or bookings.
        </Notice>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <LinkButton href={config.pages[entry.pageId].path} variant="outline">
          {config.pages[entry.pageId].navLabel}
        </LinkButton>
        {config.pages.contact.enabled ? (
          <LinkButton href={config.pages.contact.path}>{config.pages.contact.navLabel}</LinkButton>
        ) : null}
      </div>
    </article>
  );
}

export function DetailPage() {
  const { config, content } = useTenant();
  const { pathname } = useLocation();
  const routes = createRouteManifest(config, content);
  const entry = findPublicRoute(routes, pathname);
  if (entry?.kind !== "detail") return <NotFoundPage />;
  return (
    <PageFrame entry={entry}>
      <DetailContent entry={entry} routes={routes} />
    </PageFrame>
  );
}
