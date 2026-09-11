/**
 * Normalize RR 7.18 basename-prefixed document HTML and optional legacy .data.
 * Supply the absolute client directory and unique app-relative document paths
 * (including canonical aliases). Routes must be unencoded lowercase kebab-case,
 * without a trailing slash except `/`; basename permits one trailing slash.
 * Empty or `/` basename is a no-op. Resource routes and the future trailing-slash
 * data-request mode are outside this helper's contract. Call once after prerender.
 * Returns moved deploy-root-relative filenames, with forward slashes.
 */
export function normalizePrerenderOutput(
  clientDirectory: string,
  basename: string,
  routePaths: readonly string[],
): string[];
