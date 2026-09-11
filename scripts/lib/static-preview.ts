import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

type Entry = "file" | "directory" | "missing" | "unsafe";

// Do not use URL here: it normalizes dot segments before they can be rejected.
function requestPath(url: string | undefined): string | null {
  try {
    const raw = (url ?? "").split(/[?#]/, 1)[0]!;
    if (/%2f|%5c/i.test(raw)) return null;
    const pathname = decodeURIComponent(raw);
    if (
      !pathname.startsWith("/") ||
      pathname.includes("//") ||
      /[\\:%?#]/.test(pathname) ||
      [...pathname].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
      pathname
        .split("/")
        .some(
          (segment) =>
            segment === "." ||
            segment === ".." ||
            /[. ]$/.test(segment) ||
            /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment),
        )
    )
      return null;
    return pathname;
  } catch {
    return null;
  }
}

// Reject links in every component, including dangling links and Windows junctions.
// Checking only the final realpath would allow links back into the output tree.
function entryAt(root: string, pathname: string): Entry {
  let file = root;
  try {
    for (const segment of pathname.split("/").filter(Boolean)) {
      file = path.join(file, segment);
      const relative = path.relative(root, file);
      if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative))
        return "unsafe";
      if (fs.lstatSync(file).isSymbolicLink()) return "unsafe";
    }
    const stat = fs.lstatSync(file);
    return stat.isFile() ? "file" : stat.isDirectory() ? "directory" : "unsafe";
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code === "ENOENT" || code === "ENOTDIR" ? "missing" : "unsafe";
  }
}

/** Static-host 404 semantics for Vite preview only; use with preview appType: "mpa". */
export function staticPreview404(): Plugin {
  return {
    name: "static-preview-404",
    configurePreviewServer(server) {
      if (server.config.appType !== "mpa")
        throw new Error("static-preview-404 requires preview appType: mpa");

      const { base } = server.config;
      // The application derives this path from its validated siteUrl, not the request Host.
      if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*$/.test(base))
        throw new Error("static-preview-404 requires a validated root-relative base");

      const outDir = path.resolve(server.config.root, server.config.build.outDir);
      let root: string;
      let notFound: Buffer;
      try {
        const output = fs.lstatSync(outDir);
        if (output.isSymbolicLink() || !output.isDirectory()) throw new Error("unsafe output");
        root = fs.realpathSync(outDir);
        if (entryAt(root, "/404.html") !== "file") throw new Error("unsafe 404");
        notFound = fs.readFileSync(path.join(root, "404.html"));
      } catch (cause) {
        throw new Error(`static-preview-404 requires an existing regular ${outDir}/404.html`, {
          cause,
        });
      }

      function send404(req: IncomingMessage, res: ServerResponse) {
        for (const [name, value] of Object.entries(server.config.preview.headers ?? {}))
          if (value !== undefined) res.setHeader(name, value);
        res.statusCode = 404;
        res.removeHeader("Location");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Content-Length", notFound.length);
        res.end(req.method === "HEAD" ? undefined : notFound);
      }

      // This guard must precede Vite's base/static middleware: sirv can serve a
      // symlink before any post-hook, and baseMiddleware otherwise invents HTML.
      server.middlewares.use((req, res, next) => {
        const pathname = requestPath(req.url);
        const raw = (req.url ?? "").split(/[?#]/, 1)[0]!;
        const baseRoot = base !== "/" && raw === base.slice(0, -1);
        if (pathname === null || (!raw.startsWith(base) && !baseRoot)) return send404(req, res);
        const local = baseRoot ? "/" : `/${pathname.slice(base.length)}`;
        const stem = local.replace(/\/$/, "");
        const candidates = [
          local,
          `${stem}/index`, // sirv's extensionless directory index
          local.endsWith("/") ? `${local}index.html` : `${local}.html`,
          `${stem}/index.html`,
        ];
        if (candidates.some((candidate) => entryAt(root, candidate) === "unsafe"))
          return send404(req, res);
        if (req.method !== "GET" && req.method !== "HEAD") return next();

        // Prerender uses route/index.html. Vite's MPA fallback needs a trailing
        // slash for these directory routes; rewrite internally, never redirect.
        if (
          baseRoot ||
          (!local.endsWith("/") &&
            entryAt(root, local) === "directory" &&
            entryAt(root, `${local}.html`) !== "file" &&
            entryAt(root, `${local}/index.html`) === "file")
        ) {
          const url = req.url!;
          const split = url.search(/[?#]/);
          req.url = split < 0 ? `${url}/` : `${url.slice(0, split)}/${url.slice(split)}`;
        }
        next();
      });

      return () => {
        // Vite 7: static -> htmlFallback -> post-hooks -> indexHtml. At this
        // point base is ALREADY stripped, and real .html rewrites still need
        // indexHtmlMiddleware. An unconditional post-hook 404 would break them.
        server.middlewares.use((req, res, next) => {
          if (req.method !== "GET" && req.method !== "HEAD") return next();
          const pathname = requestPath(req.url);
          if (
            req.url?.split(/[?#]/, 1)[0]?.endsWith(".html") &&
            pathname?.endsWith(".html") &&
            req.headers["sec-fetch-dest"] !== "script" &&
            entryAt(root, pathname) === "file"
          )
            return next();
          send404(req, res);
        });
      };
    },
  };
}
