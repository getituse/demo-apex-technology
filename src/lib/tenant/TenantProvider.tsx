import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { TenantContent } from "@/config/content-schema";
import type { NavLink, PageId, TenantConfig, Terminology } from "@/config/tenant-schema";

/**
 * Makes the site configuration available to shared components without any of them importing
 * `@/site` directly.
 *
 * That matters twice over: components stay testable against a fixture, and the
 * tenant-neutrality rule stays mechanical — a component asks for `terminology.programPlural`
 * and never knows whether it renders "Programmes", "Courses" or "Services".
 */

export interface TenantContextValue {
  config: TenantConfig;
  content: TenantContent;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  config,
  content,
  children,
}: TenantContextValue & { children: ReactNode }) {
  const value = useMemo(() => ({ config, content }), [config, content]);
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const value = useContext(TenantContext);
  if (!value) {
    throw new Error("useTenant must be used inside <TenantProvider>.");
  }
  return value;
}

export function useTenantConfig(): TenantConfig {
  return useTenant().config;
}

export function useTenantContent(): TenantContent {
  return useTenant().content;
}

export function useTerminology(): Terminology {
  return useTenant().config.terminology;
}

/** A link a component can render: either an internal path or an external URL. */
export interface ResolvedLink {
  label: string;
  href: string;
  isExternal: boolean;
}

export function resolveNavLink(config: TenantConfig, link: NavLink): ResolvedLink | null {
  if (link.kind === "external") {
    return { label: link.label, href: link.href, isExternal: true };
  }

  const page = config.pages[link.pageId];
  // A disabled page has no route, so the link is dropped rather than rendered dead.
  if (!page.enabled) return null;

  return { label: link.label, href: page.path, isExternal: false };
}

export function usePageHref(pageId: PageId): string | null {
  const config = useTenantConfig();
  const page = config.pages[pageId];
  return page.enabled ? page.path : null;
}

/** Attributes every external link must carry. Spread rather than remembered. */
export const EXTERNAL_LINK_PROPS = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;
