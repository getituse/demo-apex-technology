import { createContext, useContext, useId, type ReactNode } from "react";

import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { Section } from "@/components/ui/Section";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/cn";
import type { SectionAction, SectionConfig } from "./section-types";

type SectionBackground = NonNullable<SectionConfig["background"]>;

const frameContext = createContext<{ inverted: boolean; headingId?: string }>({
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
  children: ReactNode;
}

export function SectionFrame({ section, background, children }: SectionFrameProps) {
  const generatedId = useId();
  const tone = background ?? section.background ?? "default";
  const density = section.density ?? "regular";
  const headingId = `section-heading-${generatedId}`;

  return (
    <frameContext.Provider value={{ inverted: tone === "inverted", headingId }}>
      <Section
        id={section.id}
        aria-labelledby={section.heading ? headingId : undefined}
        data-section-type={section.type}
        data-section-variant={section.variant ?? (section.type === "hero" ? "split" : "default")}
        data-density={density}
        data-background={tone}
        tone={tones[tone]}
        density={density === "regular" ? "default" : density}
        className="scroll-mt-24 [&:has([data-section-dismissed])]:hidden"
      >
        <Container width={section.type === "hero" ? "wide" : "default"}>{children}</Container>
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

  return (
    <div className="min-w-0 space-y-6 text-inherit [overflow-wrap:anywhere]">
      {section.eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-widest text-inherit">
          {section.eyebrow}
        </p>
      ) : null}
      {section.heading ? (
        <Heading
          id={frame.headingId ?? (section.id ? `${section.id}-heading` : undefined)}
          className={cn(
            "max-w-prose text-balance font-heading text-inherit",
            section.type === "hero" ? "text-display" : headingSize,
          )}
        >
          {section.heading}
        </Heading>
      ) : null}
      {section.body?.length ? (
        <div
          className={cn(
            "max-w-prose space-y-4 text-base leading-relaxed text-inherit",
            section.type === "hero" && "text-lg",
          )}
        >
          {section.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      <SectionActions actions={section.actions} />
      {children}
    </div>
  );
}
