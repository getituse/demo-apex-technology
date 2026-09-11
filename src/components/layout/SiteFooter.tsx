import { Link } from "react-router";

import { NavItemLink } from "@/components/navigation/NavItemLink";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { EXTERNAL_LINK_PROPS, resolveNavLink, useTenantConfig } from "@/lib/tenant/TenantProvider";

const footerLinkClasses =
  "inline-flex min-h-11 items-center text-footer-foreground/90 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring";

export function SiteFooter({ className }: { className?: string }) {
  const config = useTenantConfig();
  const year = new Date().getFullYear();
  const { legal, contact, pages } = config;

  const legalPages = (["policies", "privacy", "terms"] as const)
    .map((pageId) => ({ pageId, page: pages[pageId] }))
    .filter((entry) => entry.page.enabled);

  const navLinks = config.navigation
    .flatMap((item) => (item.kind === "group" ? item.children : [item]))
    .map((item) => resolveNavLink(config, item))
    .filter((link): link is NonNullable<typeof link> => link !== null);

  return (
    <footer className={cn("bg-footer-background text-footer-foreground", className)}>
      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-heading text-h3">{config.brand.name}</p>
            <p className="mt-2 max-w-prose text-sm text-footer-foreground/80">
              {config.brand.tagline}
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide">Explore</p>
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <NavItemLink link={link} className={footerLinkClasses} />
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide">Contact</p>
            <address className="flex flex-col gap-1 text-sm not-italic text-footer-foreground/90">
              {contact.addressLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
              <span>
                {contact.locality}
                {contact.postalCode ? ` ${contact.postalCode}` : ""}
              </span>
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className={footerLinkClasses}>
                {contact.phone}
              </a>
              <a href={`mailto:${contact.email}`} className={footerLinkClasses}>
                {contact.email}
              </a>
            </address>
          </div>

          <div>
            {config.social.length > 0 ? (
              <>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide">Follow</p>
                <ul className="flex flex-wrap gap-3">
                  {config.social.map((social) => (
                    <li key={social.platform}>
                      <a href={social.url} className={footerLinkClasses} {...EXTERNAL_LINK_PROPS}>
                        {social.label ?? social.platform}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {config.integrations.portals.length > 0 ? (
              <>
                <p className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide">Portals</p>
                <ul className="flex flex-col gap-1">
                  {config.integrations.portals.map((portal) => (
                    <li key={portal.href}>
                      <a href={portal.href} className={footerLinkClasses} {...EXTERNAL_LINK_PROPS}>
                        {portal.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-footer-foreground/20 py-6">
          {legal.demoContentNotice ? (
            <p className="text-sm text-footer-foreground/80">{legal.demoContentNotice}</p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-footer-foreground/80">
              &copy; {legal.copyrightStartYear}
              {year > legal.copyrightStartYear ? `-${year}` : ""} {legal.copyrightHolder}
              {legal.registrationLine ? ` · ${legal.registrationLine}` : ""}
            </p>

            {legalPages.length > 0 ? (
              <ul className="flex flex-wrap gap-4">
                {legalPages.map(({ pageId, page }) => (
                  <li key={pageId}>
                    <Link to={page.path} className={cn(footerLinkClasses, "text-sm")}>
                      {page.navLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Container>
    </footer>
  );
}
