import type { ReactNode } from "react";
import { Link } from "react-router";
import { PaginatedCollection } from "@/components/collections/PaginatedCollection";
import { ResponsiveImage } from "@/components/media/Image";
import { Accordion } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ContentCardView,
  ProgramCard,
  ServiceCard,
  DepartmentCard,
  NewsCard,
  EventCard,
  FacultyCard,
  TeamCard,
  TestimonialCard,
  FacilityCard,
  DownloadCard,
} from "@/components/cards";
import { cn } from "@/lib/cn";
import { SectionActions, SectionIntro } from "./section-layout";
import type { SectionComponentProps, SectionConfig } from "./section-types";

type CollectionConfig = Extract<SectionConfig, { items: unknown[] }>;
function Collection({
  section,
  headingLevel,
  children,
}: {
  section: CollectionConfig;
  headingLevel?: "h1" | "h2" | "h3";
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <SectionIntro section={section} headingLevel={headingLevel} />
      {section.items.length ? (
        children
      ) : (
        <p className="rounded border border-current p-6">{section.emptyMessage}</p>
      )}
    </div>
  );
}
function Grid({ section, children }: { section: CollectionConfig; children: ReactNode }) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-6",
        section.variant !== "list" && "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}
export function QuickLinksSection({ section, headingLevel }: SectionComponentProps<"quickLinks">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <ul
        className={cn("grid gap-3", section.variant !== "list" && "sm:grid-cols-2 lg:grid-cols-3")}
      >
        {section.items.map((action, i) => (
          <li key={i} className="min-w-0">
            <SectionActions actions={[{ ...action, variant: action.variant ?? "outline" }]} />
          </li>
        ))}
      </ul>
    </Collection>
  );
}
export function TrustStripSection({ section, headingLevel }: SectionComponentProps<"trustStrip">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <ul className={cn("flex gap-6", section.variant === "list" ? "flex-col" : "flex-wrap")}>
        {section.items.map((item) => (
          <li
            key={item.id}
            className="flex min-w-0 flex-col gap-3 rounded border border-current p-5"
          >
            {item.image && (
              <ResponsiveImage {...item.image} aspect="auto" fit="contain" className="h-16 w-36" />
            )}
            <p className="font-semibold">{item.label}</p>
            {item.isDemoContent && <Badge>{section.demoLabel ?? "Sample content"}</Badge>}
          </li>
        ))}
      </ul>
    </Collection>
  );
}
function Metrics({ section, headingLevel }: SectionComponentProps<"stats" | "results">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <dl
        className={cn("grid gap-6", section.variant !== "list" && "sm:grid-cols-2 lg:grid-cols-4")}
      >
        {section.items.map((item) => (
          <div
            key={item.id}
            className="min-w-0 border-s-2 border-current ps-5 [overflow-wrap:anywhere]"
          >
            <dt className="text-base">{item.label}</dt>
            <dd className="mt-2 font-heading text-h1">{item.value}</dd>
            {item.caption && <dd className="mt-2 text-sm">{item.caption}</dd>}
            {item.isDemoContent && (
              <dd className="mt-3">
                <Badge>{section.demoLabel ?? "Sample content"}</Badge>
              </dd>
            )}
          </div>
        ))}
      </dl>
    </Collection>
  );
}
export function StatsSection(props: SectionComponentProps<"stats">) {
  return <Metrics {...props} />;
}
export function ResultsSection(props: SectionComponentProps<"results">) {
  return <Metrics {...props} />;
}
function TextPanels({ section, headingLevel }: SectionComponentProps<"missionVision" | "values">) {
  const Heading = headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3";
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Grid section={section}>
        {section.items.map((item, i) => (
          <Card key={item.id} className="space-y-4 p-6">
            {section.type === "values" && section.variant !== "list" && (
              <span aria-hidden="true" className="font-heading text-h2 text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
            )}
            <Heading className="font-heading text-h3">{item.title}</Heading>
            {"updatedAt" in item && typeof item.updatedAt === "string" && (
              <p className="text-sm text-muted-foreground">
                Updated <time dateTime={item.updatedAt}>{item.updatedAt}</time>
              </p>
            )}
            {item.body.map((text, index) => (
              <p key={index} className="text-muted-foreground">
                {text}
              </p>
            ))}
          </Card>
        ))}
      </Grid>
    </Collection>
  );
}
export function MissionVisionSection(props: SectionComponentProps<"missionVision">) {
  return <TextPanels {...props} />;
}
export function ValuesSection(props: SectionComponentProps<"values">) {
  return <TextPanels {...props} />;
}
export function StepsSection({ section, headingLevel }: SectionComponentProps<"admissionsSteps">) {
  const Heading = headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3";
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <ol className={cn("grid gap-8", section.variant !== "list" && "md:grid-cols-3")}>
        {section.items.map((item, index) => (
          <li key={item.id} className="min-w-0 space-y-4 border-t border-current pt-5">
            <p aria-hidden="true" className="font-heading text-h1">
              {String(index + 1).padStart(2, "0")}
            </p>
            <Heading className="font-heading text-h3">{item.title}</Heading>
            {item.body.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
            <SectionActions actions={item.action ? [item.action] : undefined} />
          </li>
        ))}
      </ol>
    </Collection>
  );
}
export function NoticeBoardSection({
  section,
  headingLevel,
}: SectionComponentProps<"noticeBoard">) {
  const Heading = headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3";
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <ul
        className={cn(
          section.variant === "grid"
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            : "divide-y divide-current border-y border-current",
        )}
      >
        {section.items.map((item) => (
          <li key={item.id} className="space-y-3 py-6">
            <time dateTime={item.date} className="text-sm">
              {item.date}
            </time>
            <Heading className="font-heading text-h3">{item.title}</Heading>
            {item.body.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
            <SectionActions actions={item.action ? [item.action] : undefined} />
          </li>
        ))}
      </ul>
    </Collection>
  );
}
export function ProgramGridSection({
  section,
  headingLevel,
}: SectionComponentProps<"programGrid">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Grid section={section}>
        {section.items.map((item) => (
          <ProgramCard
            key={item.id}
            item={item}
            demoLabel={section.demoLabel}
            headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
          />
        ))}
      </Grid>
    </Collection>
  );
}
export function ServiceGridSection({
  section,
  headingLevel,
}: SectionComponentProps<"serviceGrid">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Grid section={section}>
        {section.items.map((item) => (
          <ServiceCard
            key={item.id}
            item={item}
            demoLabel={section.demoLabel}
            headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
          />
        ))}
      </Grid>
    </Collection>
  );
}
export function DepartmentGridSection({
  section,
  headingLevel,
}: SectionComponentProps<"departmentGrid">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Grid section={section}>
        {section.items.map((item) => (
          <DepartmentCard
            key={item.id}
            item={item}
            demoLabel={section.demoLabel}
            headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
          />
        ))}
      </Grid>
    </Collection>
  );
}
export function NewsGridSection({ section, headingLevel }: SectionComponentProps<"newsGrid">) {
  if (section.listing) {
    return (
      <div className="space-y-8">
        <SectionIntro section={section} headingLevel={headingLevel} />
        <PaginatedCollection
          {...section.listing}
          items={section.items}
          label={section.heading}
          emptyMessage={section.emptyMessage}
          variant={section.variant}
          getCategory={(item) => item.category}
          renderItem={(item) => (
            <NewsCard
              item={item}
              demoLabel={section.demoLabel}
              headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
            />
          )}
        />
      </div>
    );
  }
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Grid section={section}>
        {section.items.map((item) => (
          <NewsCard
            key={item.id}
            item={item}
            demoLabel={section.demoLabel}
            headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
          />
        ))}
      </Grid>
    </Collection>
  );
}
export function EventsGridSection({ section, headingLevel }: SectionComponentProps<"eventsGrid">) {
  if (section.listing) {
    return (
      <div className="space-y-8">
        <SectionIntro section={section} headingLevel={headingLevel} />
        <PaginatedCollection
          {...section.listing}
          items={section.items}
          label={section.heading}
          emptyMessage={section.emptyMessage}
          variant={section.variant}
          getCategory={(item) => item.category}
          renderItem={(item) => (
            <EventCard
              item={item}
              demoLabel={section.demoLabel}
              headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
            />
          )}
        />
      </div>
    );
  }
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Grid section={section}>
        {section.items.map((item) => (
          <EventCard
            key={item.id}
            item={item}
            demoLabel={section.demoLabel}
            headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
          />
        ))}
      </Grid>
    </Collection>
  );
}
export function FacilitiesSection({ section, headingLevel }: SectionComponentProps<"facilities">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Grid section={section}>
        {section.items.map((item) => (
          <FacilityCard
            key={item.id}
            item={item}
            demoLabel={section.demoLabel}
            headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
          />
        ))}
      </Grid>
    </Collection>
  );
}
export function FacultyGridSection({
  section,
  headingLevel,
}: SectionComponentProps<"facultyGrid">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Grid section={section}>
        {section.items.map((item) => (
          <FacultyCard
            key={item.id}
            item={item}
            demoLabel={section.demoLabel}
            headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
          />
        ))}
      </Grid>
    </Collection>
  );
}
export function TeamGridSection({ section, headingLevel }: SectionComponentProps<"teamGrid">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Grid section={section}>
        {section.items.map((item) => (
          <TeamCard
            key={item.id}
            item={item}
            demoLabel={section.demoLabel}
            headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
          />
        ))}
      </Grid>
    </Collection>
  );
}
export function TestimonialsSection({
  section,
  headingLevel,
}: SectionComponentProps<"testimonials">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Grid section={section}>
        {section.items.map((item) => (
          <TestimonialCard
            key={item.id}
            item={item}
            demoLabel={section.demoLabel}
            headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
          />
        ))}
      </Grid>
    </Collection>
  );
}
function Stories({
  section,
  headingLevel,
}: SectionComponentProps<
  "placements" | "researchHighlights" | "campusLife" | "alumniStories" | "caseStudies"
>) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Grid section={section}>
        {section.items.map((item) => (
          <ContentCardView
            key={item.id}
            item={{
              ...item,
              summary:
                "outcome" in item && item.outcome
                  ? `${item.summary} ${item.outcome}`
                  : item.summary,
            }}
            demoLabel={section.demoLabel}
            headingTag={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
          />
        ))}
      </Grid>
    </Collection>
  );
}
export function PlacementsSection(props: SectionComponentProps<"placements">) {
  return <Stories {...props} />;
}
export function ResearchHighlightsSection(props: SectionComponentProps<"researchHighlights">) {
  return <Stories {...props} />;
}
export function LifeSection(props: SectionComponentProps<"campusLife">) {
  return <Stories {...props} />;
}
export function AlumniStoriesSection(props: SectionComponentProps<"alumniStories">) {
  return <Stories {...props} />;
}
export function CaseStudiesSection(props: SectionComponentProps<"caseStudies">) {
  return <Stories {...props} />;
}
export function DownloadsSection({ section, headingLevel }: SectionComponentProps<"downloads">) {
  const Heading = headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3";
  const groups = new Map<string, typeof section.items>();
  for (const item of section.items) {
    const category = item.category ?? "Other resources";
    const group = groups.get(category);
    if (group) group.push(item);
    else groups.set(category, [item]);
  }
  return (
    <Collection section={section} headingLevel={headingLevel}>
      {[...groups].map(([category, items]) => (
        <section key={category} aria-label={category} className="space-y-5">
          <Heading className="break-words font-heading text-h3">{category}</Heading>
          <Grid section={section}>
            {items.map((item) => (
              <DownloadCard
                key={item.id}
                item={item}
                headingTag={headingLevel === "h3" ? "h5" : headingLevel === "h1" ? "h3" : "h4"}
              />
            ))}
          </Grid>
        </section>
      ))}
    </Collection>
  );
}
export function FaqSection({ section, headingLevel }: SectionComponentProps<"faq">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <Accordion
        headingLevel={headingLevel === "h3" ? "h4" : headingLevel === "h1" ? "h2" : "h3"}
        items={section.items.map((item) => ({
          id: item.id,
          question: item.question,
          answer: (
            <div className="space-y-3">
              {item.answer.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ),
        }))}
      />
    </Collection>
  );
}
export function ContactDetailsSection({
  section,
  headingLevel,
}: SectionComponentProps<"contactDetails">) {
  return (
    <Collection section={section} headingLevel={headingLevel}>
      <dl className={cn("grid gap-6", section.variant !== "list" && "sm:grid-cols-2")}>
        {section.items.map((item) => (
          <div key={item.id} className="min-w-0 space-y-2 [overflow-wrap:anywhere]">
            <dt className="font-semibold">{item.label}</dt>
            <dd>
              {item.href ? (
                item.href.startsWith("/") ? (
                  <Link to={item.href} className="inline-block min-h-11 py-2 underline">
                    {item.value}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="inline-block min-h-11 py-2 underline"
                    {...(item.href.startsWith("https://")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {item.value}
                  </a>
                )
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Collection>
  );
}
