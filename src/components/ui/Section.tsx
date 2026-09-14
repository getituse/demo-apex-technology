import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType, HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const sectionVariants = cva("w-full", {
  variants: {
    tone: {
      default: "bg-background text-foreground",
      tinted: "bg-section-tint text-foreground",
      muted: "bg-muted text-foreground",
      surface: "bg-surface text-foreground",
      inverted: "bg-footer-background text-footer-foreground",
    },
    density: {
      none: "",
      compact: "py-6 md:py-8",
      default: "py-10 md:py-14",
      spacious: "py-12 md:py-16",
    },
  },
  defaultVariants: { tone: "default", density: "default" },
});

export interface SectionProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {
  as?: ElementType;
}

export function Section({ as, tone, density, className, ...props }: SectionProps) {
  const Component = as ?? "section";
  return <Component className={cn(sectionVariants({ tone, density }), className)} {...props} />;
}
