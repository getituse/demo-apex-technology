import type { ReactNode } from "react";

import { SkipToContent } from "@/components/navigation/SkipToContent";
import { cn } from "@/lib/cn";
import { useTenantConfig } from "@/lib/tenant/TenantProvider";
import { AnnouncementBar } from "./AnnouncementBar";
import { MobileContactBar } from "./MobileContactBar";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export interface SiteLayoutProps {
  children: ReactNode;
}

/**
 * The page frame every route renders inside.
 *
 * `#main` is the skip-link target and the element route focus moves to, so it carries
 * `tabIndex={-1}`: without it the element is not programmatically focusable and the
 * skip link silently does nothing.
 */
export function SiteLayout({ children }: SiteLayoutProps) {
  const config = useTenantConfig();
  // The contact bar is fixed over the bottom of the viewport, so only the last element
  // in the flow needs clearance underneath it.
  const contactBarClearance = config.features.mobileContactBar ? "pb-16 lg:pb-0" : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkipToContent />
      <AnnouncementBar />
      <SiteHeader />

      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>

      <SiteFooter className={cn(contactBarClearance)} />
      <MobileContactBar />
    </div>
  );
}
