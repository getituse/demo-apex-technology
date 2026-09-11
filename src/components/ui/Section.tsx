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
      compact: "py-8 sm:py-10",
      default: "py-12 sm:py-16 lg:py-20",
      spacious: "py-16 sm:py-24 lg:py-32",
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
