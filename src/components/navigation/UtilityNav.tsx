import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { resolveNavLink, useTenantConfig } from "@/lib/tenant/TenantProvider";
import { NavItemLink } from "./NavItemLink";

/** Small secondary bar above the header. Hidden entirely when the flag is off. */
export function UtilityNav({ className }: { className?: string }) {
  const config = useTenantConfig();

  if (!config.features.utilityNav || config.utilityLinks.length === 0) return null;

  const links = config.utilityLinks
    .map((link) => resolveNavLink(config, link))
    .filter((link): link is NonNullable<typeof link> => link !== null);

  if (links.length === 0) return null;

  return (
    <div className={cn("hidden border-b border-border bg-muted lg:block", className)}>
      <Container>
        <nav aria-label="Utility">
          <ul className="flex items-center justify-end gap-1 py-1">
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <NavItemLink
                  link={link}
                  className="inline-flex min-h-11 items-center rounded px-2 text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                  activeClassName="font-medium text-primary"
                />
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </div>
  );
}
