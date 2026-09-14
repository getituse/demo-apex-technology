import { ArrowUpRight, Mail, MapPin, X } from "lucide-react";
import { useContext, useState, type ReactNode } from "react";

import { ResponsiveImage } from "@/components/media/Image";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { cn } from "@/lib/cn";
import { ConfiguredForm } from "@/components/forms/ConfiguredForm";
import { frameContext, SectionActions, SectionIntro } from "./section-layout";
import type { SectionComponentProps, SectionConfig } from "./section-types";

function SplitLayout({
  imageAlign = "right",
  align = "center",
  media,
  children,
}: {
  imageAlign?: SectionConfig["imageAlign"];
  align?: "center" | "start";
  media?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-8 lg:gap-12",
        align === "start" ? "items-start" : "items-center",
        media && "lg:grid-cols-2",
      )}
    >
      <div className="min-w-0">{children}</div>
      {media ? (
        <div className={cn("min-w-0", imageAlign === "left" && "lg:order-first")}>{media}</div>
      ) : null}
    </div>
  );
}

export function HeroSection({
  section,
  headingLevel: Heading = "h1",
}: SectionComponentProps<"hero">) {
  const { headingId } = useContext(frameContext);
  const [primary, secondary, tertiary] = section.images;

  if (section.variant === "collage") {
    return (
      <SplitLayout
        align="start"
        imageAlign={section.imageAlign}
        media={
          <div className="isolate grid grid-cols-12 grid-rows-[repeat(8,minmax(0,1fr))] gap-3 sm:gap-4">
            {primary ? (
              <ResponsiveImage
                {...primary}
                priority
                aspect="3/4"
                className="col-span-8 col-start-1 row-span-6 row-start-1 rounded-lg"
              />
            ) : null}
            {secondary ? (
              <ResponsiveImage
                {...secondary}
                priority
                aspect="1/1"
                className="z-10 col-span-6 col-start-7 row-span-4 row-start-3 rounded-lg border-4 border-surface bg-surface"
              />
            ) : null}
            {tertiary ? (
              <ResponsiveImage
                {...tertiary}
                priority
                aspect="4/3"
                className="z-20 col-span-6 col-start-2 row-span-3 row-start-6 rounded-lg border-4 border-surface bg-surface"
              />
            ) : null}
          </div>
        }
      >
        <SectionIntro section={section} headingLevel={Heading} />
      </SplitLayout>
    );
  }

  const leadParagraph = section.body?.[0];
  const descriptiveCopy = section.body?.slice(1) ?? [];

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Column (lg:col-span-7) */}
        <div className="min-w-0 space-y-6 [overflow-wrap:anywhere] lg:col-span-7">
          {section.eyebrow ? (
            <div>
              <Badge
                tone="outline"
                className="rounded-full border-primary/25 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-primary"
              >
                {section.eyebrow}
              </Badge>
            </div>
          ) : null}

          <Heading
            id={headingId ?? (section.id ? `${section.id}-heading` : undefined)}
            className="font-heading text-4xl font-extrabold tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl"
          >
            {section.heading}
          </Heading>

          {section.body?.length ? (
            <div className="max-w-2xl space-y-4">
              {leadParagraph ? (
                <p className="text-lg font-medium leading-relaxed text-foreground/90 sm:text-xl">
                  {leadParagraph}
                </p>
              ) : null}
              {descriptiveCopy.map((paragraph, index) => (
                <p key={index} className="text-base leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          {section.actions?.length ? (
            <div className="flex min-w-0 flex-wrap items-center gap-4 pt-2">
              {section.actions.map((action, index) => {
                const isPrimary = action.variant === "primary" || index === 0;
                const pillClasses = cn(
                  "rounded-full px-6 py-3 min-h-12 text-base font-semibold shadow-sm transition-all",
                  isPrimary
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border/80 bg-surface/50 text-foreground hover:bg-muted/80 backdrop-blur-sm",
                );

                if (/^(mailto:|tel:|#)/.test(action.href)) {
                  return (
                    <a key={`${action.href}-${index}`} href={action.href} className={pillClasses}>
                      {action.label}
                    </a>
                  );
                }

                return (
                  <LinkButton
                    key={`${action.href}-${index}`}
                    href={action.href}
                    isExternal={action.href.startsWith("https://")}
                    variant={isPrimary ? "primary" : "outline"}
                    className={pillClasses}
                  >
                    {action.label}
                  </LinkButton>
                );
              })}
            </div>
          ) : null}

          {section.keywords?.length ? (
            <div className="max-w-xl border-t border-border/40 pt-3">
              <p className="text-sm font-medium tracking-wide text-muted-foreground">
                {section.keywords.join(" · ")}
              </p>
            </div>
          ) : null}
        </div>

        {/* Right Column (lg:col-span-5) */}
        {primary ? (
          <div className="relative mx-auto w-full min-w-0 max-w-lg lg:col-span-5">
            <div
              className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary/15 via-accent/10 to-transparent opacity-70 blur-md"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-2xl ring-1 ring-border/30 sm:rounded-3xl">
              <ResponsiveImage
                {...primary}
                priority
                aspect="4/3"
                className="w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>
        ) : null}
      </div>
  );
}

export function AboutSplitSection({
  section,
  headingLevel = "h2",
}: SectionComponentProps<"aboutSplit">) {
  return (
    <SplitLayout
      imageAlign={section.imageAlign}
      media={<ResponsiveImage {...section.image} aspect="4/3" className="rounded-lg" />}
    >
      <SectionIntro section={section} headingLevel={headingLevel} />
    </SplitLayout>
  );
}

function MessageSection({
  section,
  headingLevel = "h2",
}: SectionComponentProps<"principalMessage" | "leadershipMessage">) {
  const { person } = section;

  return (
    <SplitLayout
      imageAlign={section.imageAlign}
      media={
        person.image ? (
          <ResponsiveImage
            {...person.image}
            aspect="3/4"
            className="mx-auto w-full max-w-sm rounded-lg"
          />
        ) : undefined
      }
    >
      <SectionIntro section={section} headingLevel={headingLevel}>
        <figure className="space-y-6 border-s-2 border-current ps-6 sm:ps-8">
          {person.isDemoContent ? <Badge>{section.demoLabel ?? "Sample content"}</Badge> : null}
          <blockquote className="max-w-prose text-xl leading-relaxed text-inherit">
            <p>{section.quote}</p>
          </blockquote>
          <figcaption className="space-y-3 text-base leading-relaxed text-inherit">
            <div>
              <p className="font-semibold">{person.title}</p>
              <p>{person.role}</p>
            </div>
            <p>{person.summary}</p>
            {person.credentials.length ? (
              <ul className="list-disc space-y-1 ps-5">
                {person.credentials.map((credential, index) => (
                  <li key={index}>{credential}</li>
                ))}
              </ul>
            ) : null}
            {person.action ? <SectionActions actions={[person.action]} /> : null}
          </figcaption>
        </figure>
      </SectionIntro>
    </SplitLayout>
  );
}

export function PrincipalMessageSection(props: SectionComponentProps<"principalMessage">) {
  return <MessageSection {...props} />;
}

export function LeadershipMessageSection(props: SectionComponentProps<"leadershipMessage">) {
  return <MessageSection {...props} />;
}

export function ApplicationCTASection({
  section,
  headingLevel = "h2",
}: SectionComponentProps<"applicationCTA">) {
  return (
    <div className="grid items-start gap-6 border-s-4 border-current ps-6 sm:ps-10 lg:grid-cols-[minmax(0,1fr)_auto]">
      <SectionIntro section={section} headingLevel={headingLevel} />
      <ArrowUpRight className="hidden h-12 w-12 lg:block" aria-hidden="true" />
    </div>
  );
}

export function FinalCTASection({
  section,
  headingLevel = "h2",
}: SectionComponentProps<"finalCTA">) {
  return (
    <div className="mx-auto max-w-3xl border-t border-current pt-6 md:pt-8">
      <SectionIntro section={section} headingLevel={headingLevel} />
    </div>
  );
}

export function AnnouncementSection({
  section,
  headingLevel = "h2",
}: SectionComponentProps<"announcementBar">) {
  const [dismissed, setDismissed] = useState(false);

  // The frame also hides when this marker is present, avoiding an empty padded band.
  if (dismissed) return <span hidden data-section-dismissed />;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <SectionIntro
          section={{ ...section, body: [section.message, ...(section.body ?? [])] }}
          headingLevel={headingLevel}
        />
      </div>
      {section.dismissLabel ? (
        <IconButton
          label={section.dismissLabel}
          icon={<X className="h-5 w-5" />}
          variant="outline"
          className="shrink-0"
          onClick={() => setDismissed(true)}
        />
      ) : null}
    </div>
  );
}

export function MapSection({ section, headingLevel = "h2" }: SectionComponentProps<"map">) {
  return (
    <SplitLayout
      imageAlign={section.imageAlign}
      media={
        section.image ? (
          <ResponsiveImage
            {...section.image}
            aspect="4/3"
            fit="contain"
            className="rounded-lg border border-border bg-surface"
          />
        ) : undefined
      }
    >
      <SectionIntro section={section} headingLevel={headingLevel}>
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
            <address className="space-y-1 text-base not-italic leading-relaxed text-inherit">
              {section.address.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </address>
          </div>
          <SectionActions actions={[section.directions]} />
        </div>
      </SectionIntro>
    </SplitLayout>
  );
}

export function NewsletterSection({
  section,
  headingLevel = "h2",
}: SectionComponentProps<"newsletter">) {
  return (
    <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        <Mail className="h-6 w-6" aria-hidden="true" />
      </div>
      <SectionIntro section={section} headingLevel={headingLevel}>
        <div className="space-y-6">
          <p className="max-w-prose border-s-2 border-current ps-4 text-base leading-relaxed text-inherit">
            {section.notice}
          </p>
          {section.formId ? (
            <ConfiguredForm formId={section.formId} label={section.heading} />
          ) : (
            <SectionActions actions={[section.action]} />
          )}
        </div>
      </SectionIntro>
    </div>
  );
}
