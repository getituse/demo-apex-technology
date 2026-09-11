import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { buttonVariants, type ButtonVariantProps } from "./button-variants";

export interface IconButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color" | "children">,
    Omit<ButtonVariantProps, "block"> {
  /** Required: an icon-only control has no visible text to name it. */
  label: string;
  icon: ReactNode;
}

const sizeClasses = {
  sm: "h-9 w-9 p-0",
  md: "h-11 w-11 p-0",
  lg: "h-12 w-12 p-0",
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, variant, size = "md", label, icon, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={props.type ?? "button"}
      aria-label={label}
      className={cn(buttonVariants({ variant, size }), sizeClasses[size ?? "md"], className)}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
});
