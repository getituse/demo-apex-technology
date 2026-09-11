import { config } from "@/site";

import { NotFoundPage } from "./route-frame";
import { createRouteMeta } from "./route-manifest";

export function meta() {
  return createRouteMeta(config);
}

// No server loader on this non-prerendered route: ssr:false has no runtime server.
// The static host must supply the HTTP 404 status; client navigation gets a router 404.
export function clientLoader() {
  throw new Response("Page not found", { status: 404, statusText: "Not Found" });
}

export default NotFoundPage;
export { NotFoundPage as ErrorBoundary };
