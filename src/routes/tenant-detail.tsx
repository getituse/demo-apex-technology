import type { ClientLoaderFunctionArgs, LoaderFunctionArgs, MetaArgs } from "react-router";
import { config, content } from "@/site";

import { DetailPage } from "./detail-content";
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

function requireDetail(request: Request) {
  const entry = requirePublicRoute(
    routes,
    stripSiteBase(config.siteUrl, new URL(request.url).pathname) ?? "",
  );
  if (entry.kind !== "detail") {
    throw new Response("Page not found", { status: 404, statusText: "Not Found" });
  }
  return null;
}

// Detail records have no clock-derived groups. Loader data still keeps their
// prerendered bodies in the initial HTML rather than a hydration fallback.
export function loader({ request }: LoaderFunctionArgs) {
  return requireDetail(request);
}

export function clientLoader({ request }: ClientLoaderFunctionArgs) {
  return requireDetail(request);
}

export default DetailPage;
export { PageErrorBoundary as ErrorBoundary } from "./route-frame";
