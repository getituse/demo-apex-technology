import { X } from "lucide-react";
import { useState } from "react";

import { NavItemLink } from "@/components/navigation/NavItemLink";
import { Container } from "@/components/ui/Container";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { resolveNavLink, useTenantConfig } from "@/lib/tenant/TenantProvider";

export interface AnnouncementBarProps {
  dismissLabel?: string;
  className?: string;
}

/**
 * Optional strip above the header, driven entirely by `config.announcement`.
 *
 * The schema refuses a config where `features.announcementBar` is true but no
 * announcement is supplied, so this can never render an empty bar.
 *
 * Dismissible, because an undismissable banner that follows you across a whole site
 * is an accessibility and patience problem.
 */
export function AnnouncementBar({
  dismissLabel = "Dismiss announcement",
  className,
}: AnnouncementBarProps) {
  const config = useTenantConfig();
  const [dismissed, setDismissed] = useState(false);

  const announcement = config.announcement;
  if (!config.features.announcementBar || !announcement || dismissed) return null;

  const cta = announcement.link ? resolveNavLink(config, announcement.link) : null;

  return (
    <div className={cn("bg-primary text-primary-foreground", className)}>
      <Container>
        <div className="flex min-h-11 items-center justify-between gap-4 py-2">
          <p className="text-sm">
            {announcement.message}
            {cta ? (
              <>
                {" "}
                <NavItemLink
                  link={cta}
                  className="font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                />
              </>
            ) : null}
          </p>
          <IconButton
            variant="ghost"
            label={dismissLabel}
            icon={<X className="h-4 w-4" />}
            onClick={() => setDismissed(true)}
            className="shrink-0 text-primary-foreground hover:bg-primary-foreground/10"
          />
        </div>
      </Container>
    </div>
  );
}
