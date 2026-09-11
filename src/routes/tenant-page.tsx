import {
  useLoaderData,
  type ClientLoaderFunctionArgs,
  type LoaderFunctionArgs,
  type MetaArgs,
} from "react-router";
import { useIsPresent } from "motion/react";
import { config, content } from "@/site";

import { CorePage } from "./page-content";
import { resolvePageSections } from "./page-sections";
import { stripSiteBase } from "../lib/site-url";
import {
  createRouteManifest,
  createRouteMeta,
  findPublicRoute,
  requirePublicRoute,
} from "./route-manifest";

const routes = createRouteManifest(config, content);

export function meta({ location }: MetaArgs) {
  return createRouteMeta(config, findPublicRoute(routes, location.pathname), content);
}

function pageSnapshot(request: Request) {
  const entry = requirePublicRoute(
    routes,
    stripSiteBase(config.siteUrl, new URL(request.url).pathname) ?? "",
  );
  if (entry.kind !== "page") {
    throw new Response("Page not found", { status: 404, statusText: "Not Found" });
  }
  const referenceTime = new Date().toISOString();
  resolvePageSections(config, content, entry.pageId, referenceTime);
  return { referenceTime };
}

// Prerender serializes this snapshot for the initial hydration. Do not opt the
// clientLoader into hydration: date groups must first use the same instant as HTML.
export function loader({ request }: LoaderFunctionArgs) {
  return pageSnapshot(request);
}

// Subsequent navigation uses a fresh local snapshot, never a server/network loader.
export function clientLoader({ request }: ClientLoaderFunctionArgs) {
  return pageSnapshot(request);
}

export default function TenantPageRoute() {
  const isPresent = useIsPresent();
  const snapshot = useLoaderData<typeof loader>();
  // AnimatePresence retains a departing outlet for a render even without an exit
  // animation. Its route context is old, but router loaderData is already for the
  // destination. Entry-only transitions must not render that stale page.
  if (!isPresent) return null;
  const { referenceTime } = snapshot;
  return <CorePage referenceTime={referenceTime} />;
}

export { PageErrorBoundary as ErrorBoundary } from "./route-frame";
