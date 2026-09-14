import { useEffect, useState } from "react";
import { Link } from "react-router";

import { DesktopNav } from "@/components/navigation/DesktopNav";
import { MobileNav } from "@/components/navigation/MobileNav";
import { UtilityNav } from "@/components/navigation/UtilityNav";
import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/media/Image";
import { LinkButton } from "@/components/ui/LinkButton";
import { cn } from "@/lib/cn";
import { resolveNavLink, useTenantConfig } from "@/lib/tenant/TenantProvider";

/**
 * Sticky header with restrained scroll behaviour: it gains a shadow once the page has
 * moved, and nothing else. It never hides on scroll-down — a header that disappears
 * while you are reaching for it fails "nothing important is hover-only" in spirit.
 */
export function SiteHeader({ className }: { className?: string }) {
  const config = useTenantConfig();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const primaryCta = resolveNavLink(config, config.brand.primaryCta);
  const homePath = config.pages.home.path;

  return (
    <header
      className={cn(
        config.features.stickyHeader && "sticky top-0 z-40",
        "bg-header-background",
        className,
      )}
    >
      <UtilityNav />

      <div
        className={cn(
          "border-b border-border transition-shadow duration-200 motion-reduce:transition-none",
          scrolled && "shadow-md",
        )}
      >
        <Container>
          <div className="flex min-h-[4.5rem] flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3 sm:min-h-20 sm:py-3.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2 lg:gap-x-8 xl:gap-x-10">
              <Link
                to={homePath}
                className="flex min-h-11 min-w-0 shrink-0 items-center rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <ResponsiveImage
                  src={config.brand.logo}
                  alt={config.brand.name}
                  width={420}
                  height={96}
                  fit="contain"
                  priority
                  className="flex h-12 max-h-14 w-auto max-w-[55vw] shrink-0 items-center sm:h-14 sm:max-w-none lg:h-[3.5rem]"
                  imgClassName="h-full w-auto object-contain"
                />
              </Link>

              <DesktopNav />
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
              {primaryCta ? (
                <LinkButton
                  href={primaryCta.href}
                  isExternal={primaryCta.isExternal}
                  className="hidden sm:inline-flex"
                >
                  {primaryCta.label}
                </LinkButton>
              ) : null}
              <MobileNav />
            </div>
          </div>
        </Container>
      </div>
    </header>
  );
}
