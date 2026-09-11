import { NavLink as RouterNavLink } from "react-router";

import { cn } from "@/lib/cn";
import { EXTERNAL_LINK_PROPS, type ResolvedLink } from "@/lib/tenant/TenantProvider";

export interface NavItemLinkProps {
  link: ResolvedLink;
  className?: string;
  activeClassName?: string;
  /** Set when the link sits inside an open dropdown or drawer. */
  onNavigate?: () => void;
}

/**
 * One link, with the active state applied by the router rather than by comparing
 * strings. `aria-current="page"` is what a screen reader announces; the visual
 * treatment is only the sighted half of the same information.
 */
export function NavItemLink({ link, className, activeClassName, onNavigate }: NavItemLinkProps) {
  if (link.isExternal) {
    return (
      <a href={link.href} className={cn(className)} onClick={onNavigate} {...EXTERNAL_LINK_PROPS}>
        {link.label}
      </a>
    );
  }

  return (
    <RouterNavLink
      to={link.href}
      end={link.href === "/"}
      onClick={onNavigate}
      className={({ isActive }) => cn(className, isActive && activeClassName)}
    >
      {link.label}
    </RouterNavLink>
  );
}
