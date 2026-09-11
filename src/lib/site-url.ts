const basePathPattern = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/;
const localPathPattern = /^\/(?:[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*\/?)?$/;

function parseSiteUrl(siteUrl: string): { origin: string; basePath: string } {
  if (
    !siteUrl.startsWith("https://") ||
    siteUrl.startsWith("https:///") ||
    /[\s\\@%?#]/.test(siteUrl) ||
    [...siteUrl].some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  ) {
    throw new Error("siteUrl must use https without credentials, encoding, query or fragment");
  }

  const url = new URL(siteUrl);
  const pathStart = siteUrl.indexOf("/", "https://".length);
  const pathname = pathStart === -1 ? "/" : siteUrl.slice(pathStart);
  const basePath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  if (!basePathPattern.test(basePath) || pathname === "//") {
    throw new Error("siteUrl base must contain only lowercase kebab-case path segments");
  }

  return { origin: url.origin, basePath };
}

function isLocalPath(path: string): boolean {
  return (
    !/\s/.test(path) &&
    localPathPattern.test(path) &&
    !path.split("/").some((segment) => segment === "." || segment === "..")
  );
}

function joinLocalPath(basePath: string, localPath: string): string {
  if (!isLocalPath(localPath)) {
    throw new Error(
      "localPath must be an unencoded root-relative path without traversal or suffixes",
    );
  }
  return basePath === "/" ? localPath : `${basePath}${localPath}`;
}

export function siteBasePath(siteUrl: string): string {
  return parseSiteUrl(siteUrl).basePath;
}

export function absoluteSiteUrl(siteUrl: string, localPath: string): string {
  const { origin, basePath } = parseSiteUrl(siteUrl);
  return `${origin}${joinLocalPath(basePath, localPath)}`;
}

export function deploymentPath(siteUrl: string, localPath: string): string {
  return joinLocalPath(siteBasePath(siteUrl), localPath);
}

export function stripSiteBase(siteUrl: string, pathname: string): string | null {
  const basePath = siteBasePath(siteUrl);
  if (!isLocalPath(pathname)) return null;
  if (basePath === "/") return pathname;
  if (pathname === basePath) return "/";
  return pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : null;
}
