import { createContext, useContext, useId, type ReactNode } from "react";

import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { Section } from "@/components/ui/Section";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/cn";
import type { SectionAction, SectionConfig } from "./section-types";

type SectionBackground = NonNullable<SectionConfig["background"]>;

export const frameContext = createContext<{ inverted: boolean; headingId?: string }>({
  inverted: false,
});

const tones = {
  default: "default",
  muted: "muted",
  tint: "tinted",
  inverted: "inverted",
} as const;

export interface SectionFrameProps {
  section: SectionConfig;
  background?: SectionBackground;
  isFirst?: boolean;
  children: ReactNode;
}

export function SectionFrame({ section, background, isFirst, children }: SectionFrameProps) {
  const generatedId = useId();
  const tone = background ?? section.background ?? "default";
  const density = section.density ?? "regular";
  const isHero = section.type === "hero";
  const headingId = `section-heading-${generatedId}`;

  return (
    <frameContext.Provider value={{ inverted: tone === "inverted", headingId }}>
      <Section
        id={section.id}
        aria-labelledby={section.heading ? headingId : undefined}
        data-section-type={section.type}
        data-section-variant={section.variant ?? (isHero ? "split" : "default")}
        data-density={density}
        data-background={tone}
        tone={tones[tone]}
        density={isHero ? "none" : density === "regular" ? "default" : density}
        className={cn(
          "scroll-mt-24 [&:has([data-section-dismissed])]:hidden",
          isHero &&
            "relative isolate overflow-hidden pt-6 md:pt-8 pb-8 md:pb-10",
          !isHero && isFirst && "!pt-2 sm:!pt-3 md:!pt-4",
        )}
      >
        {isHero ? (
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.10),transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.10),transparent_50%)]"
            aria-hidden="true"
          >
            <svg
              className="absolute inset-0 h-full w-full stroke-border/20 [mask-image:radial-gradient(100%_100%_at_center,white,transparent)]"
              aria-hidden="true"
            >
              <defs>
                <pattern id="hero-mesh-grid-full" width={48} height={48} patternUnits="userSpaceOnUse">
                  <path d="M.5 48V.5H48" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" strokeWidth={0} fill="url(#hero-mesh-grid-full)" />
            </svg>
          </div>
        ) : null}
        <Container width={isHero ? "wide" : "default"}>{children}</Container>
      </Section>
    </frameContext.Provider>
  );
}

export interface SectionActionsProps {
  actions?: SectionAction[];
}

export function SectionActions({ actions }: SectionActionsProps) {
  const { inverted } = useContext(frameContext);
  if (!actions?.length) return null;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      {actions.map((action, index) => {
        const requestedVariant = action.variant ?? "primary";
        const variant = inverted && requestedVariant === "ghost" ? "inverted" : requestedVariant;
        const classes = cn(
          "h-auto min-h-11 w-full max-w-full whitespace-normal break-words py-3 text-center sm:w-auto",
          // Keep filled controls opaque even when the enclosing band is inverted.
          variant === "primary" && "hover:bg-primary hover:underline",
          variant === "secondary" && "hover:bg-secondary hover:underline",
        );

        if (/^(mailto:|tel:|#)/.test(action.href)) {
          return (
            <a
              key={`${action.href}-${index}`}
              href={action.href}
              className={cn(buttonVariants({ variant }), classes)}
            >
              {action.label}
            </a>
          );
        }

        return (
          <LinkButton
            key={`${action.href}-${index}`}
            href={action.href}
            isExternal={action.href.startsWith("https://")}
            variant={variant}
            className={classes}
          >
            {action.label}
          </LinkButton>
        );
      })}
    </div>
  );
}

export interface SectionIntroProps {
  section: SectionConfig;
  headingLevel?: "h1" | "h2" | "h3";
  children?: ReactNode;
}

export function SectionIntro({
  section,
  headingLevel: Heading = "h2",
  children,
}: SectionIntroProps) {
  const frame = useContext(frameContext);
  const headingSize = { h1: "text-h1", h2: "text-h2", h3: "text-h3" }[Heading];

  const hasDisplayHeadline = section.type === "hero" && Boolean(section.body?.[0]?.includes("\n"));
  const displayHeadline = hasDisplayHeadline ? section.body![0]! : null;
  const visibleBody = hasDisplayHeadline ? section.body!.slice(1) : section.body;

  return (
    <div className="min-w-0 space-y-4 text-inherit [overflow-wrap:anywhere]">
      {section.eyebrow ? (
        section.type === "hero" ? (
          <div>
            <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              {section.eyebrow}
            </span>
          </div>
        ) : (
          <p className="text-sm font-semibold uppercase tracking-widest text-inherit">
            {section.eyebrow}
          </p>
        )
      ) : null}
      {section.heading ? (
        <Heading
          id={frame.headingId ?? (section.id ? `${section.id}-heading` : undefined)}
          className={cn(
            "max-w-prose font-heading text-inherit",
            hasDisplayHeadline
              ? "sr-only"
              : section.type === "hero"
                ? "space-y-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[3rem]"
                : cn(headingSize, "text-balance"),
          )}
        >
          {section.heading.includes("\n")
            ? section.heading.split("\n").map((line, index) => (
                <span key={index} className="block">
                  {line}
                </span>
              ))
            : section.heading}
        </Heading>
      ) : null}
      {displayHeadline ? (
        <div className="max-w-prose space-y-2 font-heading text-3xl font-bold leading-tight tracking-tight text-inherit sm:text-4xl lg:text-[3rem]">
          {displayHeadline.split("\n").map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </div>
      ) : null}
      {visibleBody?.length ? (
        <div
          className={cn(
            "max-w-prose space-y-3 text-base leading-relaxed text-inherit",
            section.type === "hero" && "max-w-xl text-lg font-normal opacity-90 sm:text-xl",
          )}
        >
          {visibleBody.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      <SectionActions actions={section.actions} />
      {children}
    </div>
  );
}
