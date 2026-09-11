import { ArrowUpRight, Mail, MapPin, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { ResponsiveImage } from "@/components/media/Image";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { ConfiguredForm } from "@/components/forms/ConfiguredForm";
import { SectionActions, SectionIntro } from "./section-layout";
import type { SectionComponentProps, SectionConfig } from "./section-types";

function SplitLayout({
  imageAlign = "right",
  media,
  children,
}: {
  imageAlign?: SectionConfig["imageAlign"];
  media?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid items-center gap-8 lg:gap-16", media && "lg:grid-cols-2")}>
      <div className="min-w-0">{children}</div>
      {media ? (
        <div className={cn("min-w-0", imageAlign === "left" && "lg:order-first")}>{media}</div>
      ) : null}
    </div>
  );
}

export function HeroSection({ section, headingLevel = "h1" }: SectionComponentProps<"hero">) {
  const [primary, secondary, tertiary] = section.images;

  if (section.variant === "editorial") {
    return (
      <div className="isolate grid min-w-0 grid-cols-12">
        {primary ? (
          <ResponsiveImage
            {...primary}
            priority
            aspect="16/9"
            className="col-span-12 col-start-1 row-start-1 rounded-lg max-sm:aspect-[4/3]"
          />
        ) : null}
        <div className="relative z-10 col-span-12 row-start-2 min-w-0 rounded-lg border border-border bg-surface p-6 text-foreground sm:col-span-10 sm:col-start-2 sm:-mt-16 sm:p-10 lg:col-span-8 lg:col-start-2 lg:-mt-24 lg:p-12">
          <SectionIntro section={section} headingLevel={headingLevel} />
        </div>
      </div>
    );
  }

  if (section.variant === "collage") {
    return (
      <SplitLayout
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
        <SectionIntro section={section} headingLevel={headingLevel} />
      </SplitLayout>
    );
  }

  return (
    <SplitLayout
      imageAlign={section.imageAlign}
      media={
        primary ? (
          <ResponsiveImage
            {...primary}
            priority
            aspect="4/3"
            className="rounded-lg lg:aspect-[3/4]"
          />
        ) : undefined
      }
    >
      <SectionIntro section={section} headingLevel={headingLevel} />
    </SplitLayout>
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
    <div className="mx-auto max-w-3xl border-t border-current pt-8 sm:pt-12">
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
