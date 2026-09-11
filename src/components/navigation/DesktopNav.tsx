import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { AnimatePresence, dropdown, m } from "@/lib/motion";
import { resolveNavLink, useTenantConfig } from "@/lib/tenant/TenantProvider";
import { ChevronDown } from "lucide-react";
import { NavItemLink } from "./NavItemLink";

const linkClasses =
  "inline-flex min-h-11 items-center rounded px-3 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring";
const activeClasses = "font-medium text-primary";

/**
 * Desktop navigation.
 *
 * Dropdowns open on click only. Hover-to-open was tried and removed: it is unusable on
 * a touch screen, and combined with click-to-toggle it made the pointer path
 * hover-then-click *close* the menu the hover had just opened. Click is unambiguous
 * for mouse, touch and keyboard alike.
 */
export function DesktopNav({ className }: { className?: string }) {
  const config = useTenantConfig();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Clicking away or pressing Escape closes the menu, so it is never left stranded.
  useEffect(() => {
    if (openGroup === null) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenGroup(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const nav = navRef.current;
      if (nav?.contains(document.activeElement)) {
        nav.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')?.focus();
      }
      setOpenGroup(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openGroup]);

  return (
    <nav ref={navRef} aria-label="Primary" className={cn("hidden lg:block", className)}>
      <ul className="flex flex-wrap items-center gap-1">
        {config.navigation.map((item) => {
          if (item.kind === "group") {
            const children = item.children
              .map((child) => resolveNavLink(config, child))
              .filter((link): link is NonNullable<typeof link> => link !== null);

            if (children.length === 0) return null;
            const isOpen = openGroup === item.label;

            return (
              <li key={item.label} className="relative">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() => setOpenGroup(isOpen ? null : item.label)}
                  className={cn(linkClasses, "gap-1")}
                >
                  {item.label}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 transition-transform duration-150 motion-reduce:transition-none",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isOpen ? (
                    <m.ul
                      variants={dropdown}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute left-0 top-full z-40 min-w-56 rounded border border-border bg-surface-elevated p-1 shadow-md"
                    >
                      {children.map((child) => (
                        <li key={`${child.label}-${child.href}`}>
                          <NavItemLink
                            link={child}
                            onNavigate={() => setOpenGroup(null)}
                            className={cn(linkClasses, "w-full justify-start")}
                            activeClassName={activeClasses}
                          />
                        </li>
                      ))}
                    </m.ul>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          }

          const link = resolveNavLink(config, item);
          if (!link) return null;

          return (
            <li key={`${link.label}-${link.href}`}>
              <NavItemLink link={link} className={linkClasses} activeClassName={activeClasses} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
