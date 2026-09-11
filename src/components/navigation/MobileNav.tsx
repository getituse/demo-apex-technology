import { Menu } from "lucide-react";
import { useRef, useState } from "react";

import { Drawer } from "@/components/ui/Drawer";
import { IconButton } from "@/components/ui/IconButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { cn } from "@/lib/cn";
import { resolveNavLink, useTenantConfig } from "@/lib/tenant/TenantProvider";
import { NavItemLink } from "./NavItemLink";

const linkClasses =
  "flex min-h-11 w-full items-center rounded px-3 py-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring";
const activeClasses = "font-medium text-primary";

export interface MobileNavProps {
  openLabel?: string;
  title?: string;
  className?: string;
}

/**
 * Focus, Escape, scroll lock and focus return all come from the Drawer (Radix Dialog).
 * The one thing that still has to be done here is closing on navigate — otherwise the
 * route changes behind an open panel and focus is left inside a dialog over a new page.
 */
export function MobileNav({ openLabel = "Open menu", title = "Menu", className }: MobileNavProps) {
  const config = useTenantConfig();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const primaryCta = resolveNavLink(config, config.brand.primaryCta);

  return (
    <div className={cn("lg:hidden", className)}>
      <IconButton
        ref={triggerRef}
        variant="ghost"
        label={openLabel}
        icon={<Menu className="h-6 w-6" />}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      />

      <Drawer open={open} onOpenChange={setOpen} title={title}>
        <nav aria-label="Primary">
          <ul className="flex flex-col gap-1">
            {config.navigation.map((item) => {
              if (item.kind === "group") {
                const children = item.children
                  .map((child) => resolveNavLink(config, child))
                  .filter((link): link is NonNullable<typeof link> => link !== null);

                if (children.length === 0) return null;

                return (
                  <li key={item.label}>
                    {/* A group heading, not a control: everything under it is reachable. */}
                    <p className="px-3 pb-1 pt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {children.map((child) => (
                        <li key={`${child.label}-${child.href}`}>
                          <NavItemLink
                            link={child}
                            onNavigate={() => setOpen(false)}
                            className={linkClasses}
                            activeClassName={activeClasses}
                          />
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }

              const link = resolveNavLink(config, item);
              if (!link) return null;

              return (
                <li key={`${link.label}-${link.href}`}>
                  <NavItemLink
                    link={link}
                    onNavigate={() => setOpen(false)}
                    className={linkClasses}
                    activeClassName={activeClasses}
                  />
                </li>
              );
            })}
          </ul>
        </nav>

        {config.utilityLinks.length > 0 ? (
          <ul className="mt-6 flex flex-col gap-1 border-t border-border pt-4">
            {config.utilityLinks.map((utilityLink) => {
              const link = resolveNavLink(config, utilityLink);
              if (!link) return null;
              return (
                <li key={`${link.label}-${link.href}`}>
                  <NavItemLink
                    link={link}
                    onNavigate={() => setOpen(false)}
                    className={cn(linkClasses, "text-muted-foreground")}
                    activeClassName={activeClasses}
                  />
                </li>
              );
            })}
          </ul>
        ) : null}

        {primaryCta ? (
          <LinkButton
            href={primaryCta.href}
            isExternal={primaryCta.isExternal}
            block
            className="mt-6"
            onClick={() => setOpen(false)}
          >
            {primaryCta.label}
          </LinkButton>
        ) : null}
      </Drawer>
    </div>
  );
}
