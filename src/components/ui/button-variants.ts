import { cva, type VariantProps } from "class-variance-authority";

/**
 * Shared by Button, IconButton and LinkButton.
 *
 * They are three components rather than one polymorphic component on purpose: a link
 * navigates and a button acts, and blurring that is how you end up with a `div` that
 * only works with a mouse. Keeping the classes here means they still look identical.
 */
export const buttonVariants = cva(
  [
    // Labels wrap and the height grows rather than overflowing at large text sizes.
    "inline-flex max-w-full items-center justify-center gap-2 rounded text-center font-medium",
    "transition-colors duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        outline: "border border-input bg-surface text-primary hover:bg-muted",
        ghost: "text-primary hover:bg-muted",
        destructive: "bg-destructive text-primary-foreground hover:bg-destructive/90",
        // For use on an inverted band such as the footer.
        inverted: "bg-surface text-primary hover:bg-muted",
      },
      size: {
        // 44px minimum touch target on the two sizes used on mobile.
        sm: "min-h-9 px-3 py-1.5 text-sm",
        md: "min-h-11 px-5 py-2 text-base",
        lg: "min-h-12 px-6 py-2.5 text-base",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
