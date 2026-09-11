import {
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "react-router";
import { useEffect, type ReactNode } from "react";
import { config, content } from "@/site";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkButton } from "@/components/ui/LinkButton";
import { RouteAnnouncer } from "@/hooks/use-route-announcement";
import { MotionProvider } from "@/lib/motion";
import { RouteTransition } from "@/lib/motion/RouteTransition";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import { resolveTheme, themeToCss } from "./themes/apply-theme";
import { deploymentPath } from "./lib/site-url";
import { createRouteMeta } from "./routes/route-manifest";
import "./styles/fonts.css";
import "./styles/app.css";

// Computed at module scope, so it is inlined into the prerendered HTML rather than
// applied on mount. That is what rules out a flash of unthemed content.
const themeCss = themeToCss(resolveTheme(config.theme));

// Child routes replace these descriptors. The root-only static fallback remains noindex.
export function meta() {
  return createRouteMeta(config);
}

export function Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // A committed client effect distinguishes hydrated UI from identical prerendered markup.
    document.documentElement.dataset.hydrated = "true";
    return () => {
      delete document.documentElement.dataset.hydrated;
    };
  }, []);
  return (
    <html lang={config.defaultLocale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Without this the browser requests /favicon.ico, which React Router then
            tries to match as a route and logs an error for on every page load. */}
        <link
          rel="icon"
          href={deploymentPath(config.siteUrl, config.brand.favicon)}
          type="image/svg+xml"
        />
        {import.meta.env.PROD && (
          <>
            <link
              rel="icon"
              href={deploymentPath(config.siteUrl, "/favicon-32.png")}
              type="image/png"
              sizes="32x32"
            />
            <link
              rel="apple-touch-icon"
              href={deploymentPath(config.siteUrl, "/apple-touch-icon.png")}
              sizes="180x180"
            />
            <link rel="manifest" href={deploymentPath(config.siteUrl, "/manifest.webmanifest")} />
          </>
        )}
        {/* After <Links> and outside @layer base, so the tenant theme always wins. */}
        <style>{themeCss}</style>
      </head>
      <body>
        <TenantProvider config={config} content={content}>
          <MotionProvider>
            {children}
            <RouteAnnouncer />
          </MotionProvider>
        </TenantProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <SiteLayout>
      <RouteTransition />
    </SiteLayout>
  );
}

export function HydrateFallback() {
  return (
    <Container className="py-16">
      <ErrorState
        as="h1"
        title="Page not found"
        description="This address is unavailable. Return to the home page to explore the available pages."
        action={
          <a
            href={deploymentPath(config.siteUrl, config.pages.home.path)}
            className="inline-block min-h-11 py-3 text-primary underline"
          >
            {config.pages.home.navLabel}
          </a>
        }
      />
    </Container>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong";
  const detail = isRouteErrorResponse(error)
    ? String(error.data)
    : "An unexpected error occurred. Please try again.";

  return (
    <SiteLayout>
      <Container className="py-16">
        <ErrorState
          as="h1"
          title={title}
          description={detail}
          action={
            <LinkButton href={config.pages.home.path}>{config.pages.home.navLabel}</LinkButton>
          }
        />
      </Container>
    </SiteLayout>
  );
}
