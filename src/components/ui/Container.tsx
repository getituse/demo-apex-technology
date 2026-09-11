import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType, HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const containerVariants = cva("mx-auto w-full px-4 sm:px-6 lg:px-8", {
  variants: {
    width: {
      narrow: "max-w-narrow",
      prose: "max-w-prose",
      default: "max-w-6xl",
      wide: "max-w-7xl",
      full: "max-w-none",
    },
  },
  defaultVariants: { width: "default" },
});

export interface ContainerProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof containerVariants> {
  as?: ElementType;
}

export function Container({ as, width, className, ...props }: ContainerProps) {
  const Component = as ?? "div";
  return <Component className={cn(containerVariants({ width }), className)} {...props} />;
}
