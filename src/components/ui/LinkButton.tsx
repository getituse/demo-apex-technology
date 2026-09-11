import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router";

import { assetUrl } from "@/lib/asset-url";
import { cn } from "@/lib/cn";
import { EXTERNAL_LINK_PROPS } from "@/lib/tenant/TenantProvider";
import { buttonVariants, type ButtonVariantProps } from "./button-variants";

export interface LinkButtonProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "color">, ButtonVariantProps {
  href: string;
  /** External links open in a new tab and always carry rel="noopener noreferrer". */
  isExternal?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

/** Looks like a button, behaves like a link: real href, middle-click, copy address. */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
  {
    href,
    isExternal = false,
    className,
    variant,
    size,
    block,
    leadingIcon,
    trailingIcon,
    children,
    ...props
  },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size, block }), className);
  const inner = (
    <>
      {leadingIcon ? <span aria-hidden="true">{leadingIcon}</span> : null}
      {children}
      {trailingIcon ? <span aria-hidden="true">{trailingIcon}</span> : null}
    </>
  );

  if (isExternal) {
    return (
      <a ref={ref} href={assetUrl(href)} className={classes} {...EXTERNAL_LINK_PROPS} {...props}>
        {inner}
      </a>
    );
  }

  return (
    <Link ref={ref} to={href} className={classes} {...props}>
      {inner}
    </Link>
  );
});
