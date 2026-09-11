import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { buttonVariants, type ButtonVariantProps } from "./button-variants";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color">, ButtonVariantProps {
  /** Renders the child element instead of a <button>. Never use it to wrap a link. */
  asChild?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

/** A button performs an action in place. To navigate, use LinkButton. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, asChild, leadingIcon, trailingIcon, children, ...props },
  ref,
) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      // An explicit type, so a button inside a form never submits it by accident.
      type={asChild ? undefined : (props.type ?? "button")}
      {...props}
    >
      {leadingIcon ? <span aria-hidden="true">{leadingIcon}</span> : null}
      {children}
      {trailingIcon ? <span aria-hidden="true">{trailingIcon}</span> : null}
    </Component>
  );
});
