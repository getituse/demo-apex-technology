import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";

import { assetUrl } from "@/lib/asset-url";
import { cn } from "@/lib/cn";
import { EXTERNAL_LINK_PROPS } from "@/lib/tenant/TenantProvider";

const cardVariants = cva("relative rounded border border-border bg-card text-card-foreground", {
  variants: {
    elevation: {
      none: "",
      sm: "shadow-sm",
      md: "shadow-md",
    },
    interactive: {
      true: "transition-shadow duration-200 ease-out focus-within:ring-[3px] focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background hover:shadow-md",
      false: "",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
    },
  },
  defaultVariants: { elevation: "none", interactive: false, padding: "md" },
});

export interface CardProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof cardVariants> {
  as?: ElementType;
}

/**
 * A card is presentation only — it is never a clickable div.
 *
 * To make a whole card activate, put exactly one `CardLink` inside it. The link is the
 * only focusable element, so the card has one accessible name, one tab stop and a real
 * href, and there is no second control nested inside a clickable region.
 */
export function Card({ as, elevation, interactive, padding, className, ...props }: CardProps) {
  const Component = as ?? "div";
  return (
    <Component
      className={cn(cardVariants({ elevation, interactive, padding }), className)}
      {...props}
    />
  );
}

export interface CardLinkProps {
  href: string;
  isExternal?: boolean;
  children: ReactNode;
  className?: string;
}

/** Expands to cover its `Card` ancestor, so the click target is the card. */
export function CardLink({ href, isExternal = false, children, className }: CardLinkProps) {
  const classes = cn(
    "after:absolute after:inset-0 after:content-[''] focus-visible:outline-none",
    className,
  );

  if (isExternal) {
    return (
      <a href={assetUrl(href)} className={classes} {...EXTERNAL_LINK_PROPS}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={classes}>
      {children}
    </Link>
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3 flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({
  as: Heading = "h3",
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { as?: "h2" | "h3" | "h4" | "h5" }) {
  return <Heading className={cn("font-heading text-h3", className)} {...props} />;
}

export function CardMeta({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-muted-foreground", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex flex-wrap items-center gap-3", className)} {...props} />;
}
