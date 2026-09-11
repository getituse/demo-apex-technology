import { index, route, type RouteConfigEntry } from "@react-router/dev/routes";

import { config, content } from "../site";
import { createRouteManifest } from "./route-manifest";

export function createConfiguredRoutes(production: boolean): RouteConfigEntry[] {
  const manifest = createRouteManifest(config, content);
  const entriesByPath = new Map<string, (typeof manifest)[number]>();
  for (const entry of manifest) {
    if (!entriesByPath.has(entry.path) || entry.kind === "page")
      entriesByPath.set(entry.path, entry);
  }
  const routes = [...entriesByPath.values()].map((entry) => {
    const { path } = entry;
    // Paths cannot contain underscores, so this encoding is unique and Windows-safe.
    const routeId = `public${path.replaceAll("/", "__")}`;
    return path === "/"
      ? index("routes/home.tsx", { id: routeId })
      : route(
          path.slice(1),
          entry.kind === "detail" ? "routes/tenant-detail.tsx" : "routes/tenant-page.tsx",
          { id: routeId, caseSensitive: true },
        );
  });
  if (!production) routes.push(route("__styleguide", "routes/styleguide.tsx"));
  routes.push(route("*", "routes/not-found.tsx", { id: "public-not-found" }));
  return routes;
}

export function getPrerenderPaths(): string[] {
  // Direct legacy URLs need HTML too; only indexing and card lists exclude aliases.
  return createRouteManifest(config, content).map((entry) => entry.path);
}
