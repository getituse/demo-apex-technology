// @vitest-environment node
import fs from "node:fs";
import { IncomingMessage, request, ServerResponse } from "node:http";
import { Socket } from "node:net";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { preview, version, type Connect, type PreviewServer, type UserConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";

import { staticPreview404 } from "../../scripts/lib/static-preview";
import { siteBasePath } from "../../src/lib/site-url";
import { config } from "../../src/site";
import viteConfig from "../../vite.config";

vi.mock("@react-router/dev/vite", () => ({
  reactRouter: vi.fn(() => ({ name: "router-fixture" })),
}));

const HOME = Buffer.from("<!doctype html><title>Home</title><h1>Home — original</h1>\r\n");
const DEEP = Buffer.from("<!doctype html><title>Detail</title><h1>Prerendered detail</h1>\n");
const FLAT = Buffer.from("<!doctype html><title>Flat</title><h1>Flat route</h1>\n");
const NOT_FOUND = Buffer.from("<!doctype html><title>Missing</title><h1>404 — recovery</h1>\r\n");
const ASSET = Buffer.from([0, 1, 128, 255, 13, 10]);
const temporary: string[] = [];
const servers: PreviewServer[] = [];

function write(root: string, file: string, body: Buffer | string) {
  const destination = path.join(root, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, body);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vite-static-preview-"));
  temporary.push(root);
  const outDir = path.join(root, "dist", "fixture");
  write(outDir, "index.html", HOME);
  write(outDir, "news/item/index.html", DEEP);
  write(outDir, "flat.html", FLAT);
  write(outDir, "a space.html", FLAT);
  write(outDir, "assets/data.bin", ASSET);
  write(outDir, "404.html", NOT_FOUND);
  write(root, "outside/secret.html", "NOT PUBLIC");
  write(root, "outside/secret.bin", "NOT PUBLIC");
  return { root, outDir };
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  for (const directory of temporary.splice(0))
    fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});

async function configured(isPreview: boolean, command: "serve" | "build" = "serve") {
  if (typeof viteConfig !== "function") throw new Error("Expected a config factory");
  return viteConfig({ command, mode: "production", isPreview });
}

async function install(files: ReturnType<typeof fixture>, base = "/", options: UserConfig = {}) {
  const handlers: Connect.NextHandleFunction[] = [];
  const server = {
    config: {
      root: files.root,
      build: { outDir: "dist/fixture" },
      appType: "mpa",
      base,
      preview: { headers: { "X-Preview": "fixture" } },
      ...options,
    },
    middlewares: { use: (handler: Connect.NextHandleFunction) => handlers.push(handler) },
  } as unknown as PreviewServer;
  const hook = staticPreview404().configurePreviewServer;
  if (typeof hook !== "function") throw new Error("Expected preview-only hook");
  const post = await hook.call({} as never, server);
  expect(handlers).toHaveLength(1);
  if (typeof post !== "function") throw new Error("Expected deferred post-hook");
  post();
  expect(handlers).toHaveLength(2);
  return { guard: handlers[0]!, fallback: handlers[1]! };
}

function invoke(
  handler: Connect.NextHandleFunction,
  url: string,
  method = "GET",
  headers: IncomingMessage["headers"] = {},
) {
  const req = new IncomingMessage(new Socket());
  req.url = url;
  req.method = method;
  req.headers = headers;
  const res = new ServerResponse(req);
  const end = vi.spyOn(res, "end").mockImplementation(() => res);
  const next = vi.fn();
  handler(req, res, next);
  return { req, res, end, next };
}

function get(port: number, url: string, method = "GET", accept = "text/html") {
  return new Promise<{
    status: number | undefined;
    headers: IncomingMessage["headers"];
    body: Buffer;
  }>((resolve, reject) => {
    const req = request(
      {
        hostname: "127.0.0.1",
        port,
        path: url, // Unlike fetch/URL, preserves traversal for testing the guard.
        method,
        headers: { accept, "accept-encoding": "identity" },
        agent: false,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("error", reject);
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

describe("preview configuration scope", () => {
  it("uses only the 404 plugin and MPA mode for preview", async () => {
    const previewConfig = await configured(true);
    expect(previewConfig.appType).toBe("mpa");
    const basePath = siteBasePath(config.siteUrl);
    const expectedBase = basePath === "/" ? "/" : `${basePath}/`;
    expect(previewConfig.base).toBe(expectedBase);
    expect(previewConfig.preview?.host).toBe("127.0.0.1");
    expect(previewConfig.plugins).toEqual([
      expect.objectContaining({ name: "static-preview-404" }),
    ]);
    expect(reactRouter).not.toHaveBeenCalled();
    expect(Object.keys(staticPreview404()).sort()).toEqual(["configurePreviewServer", "name"]);
  });

  it.each(["serve", "build"] as const)(
    "leaves %s app plugins and appType unchanged",
    async (command) => {
      const appConfig = await configured(false, command);
      expect(appConfig.appType).toBeUndefined();
      expect(appConfig.plugins).toEqual([{ name: "router-fixture" }]);
      expect(reactRouter).toHaveBeenCalledTimes(1);
    },
  );

  it("derives preview base from the validated site URL", async () => {
    const basePath = siteBasePath(config.siteUrl);
    const expectedBase = basePath === "/" ? "/" : `${basePath}/`;
    expect((await configured(true)).base).toBe(expectedBase);
  });
});

describe("preview middleware contract", () => {
  it("defers existing HTML to Vite after base stripping, but not arbitrary extensions/directories", async () => {
    const { fallback } = await install(fixture(), "/site/");
    for (const url of [
      "/index.html",
      "/news/item/index.html?x=1",
      "/flat.html",
      "/a%20space.html",
    ]) {
      const result = invoke(fallback, url);
      expect(result.next, url).toHaveBeenCalledTimes(1);
      expect(result.end, url).not.toHaveBeenCalled();
      expect(result.req.url).toBe(url);
    }
    for (const url of ["/missing.html", "/news/item", "/assets/data.bin", "/site/index.html"]) {
      const result = invoke(fallback, url);
      expect(result.next, url).not.toHaveBeenCalled();
      expect(result.res.statusCode).toBe(404);
      expect(result.end).toHaveBeenCalledWith(NOT_FOUND);
    }
  });

  it("returns the exact built 404 bytes for GET and headers without a body for HEAD", async () => {
    const { fallback } = await install(fixture());
    for (const method of ["GET", "HEAD"]) {
      const result = invoke(fallback, "/unknown?tracking=1", method);
      expect(result.next).not.toHaveBeenCalled();
      expect(result.res.statusCode).toBe(404);
      expect(result.res.getHeader("Content-Type")).toBe("text/html; charset=utf-8");
      expect(result.res.getHeader("Content-Length")).toBe(NOT_FOUND.length);
      expect(result.res.getHeader("X-Preview")).toBe("fixture");
      expect(result.res.hasHeader("Location")).toBe(false);
      expect(result.end).toHaveBeenCalledWith(method === "HEAD" ? undefined : NOT_FOUND);
    }
  });

  it("does not defer HTML that Vite refuses as a script, or handle other safe methods", async () => {
    const { guard, fallback } = await install(fixture());
    const script = invoke(fallback, "/flat.html", "GET", { "sec-fetch-dest": "script" });
    expect(script.end).toHaveBeenCalledWith(NOT_FOUND);
    for (const handler of [guard, fallback]) {
      const result = invoke(handler, "/missing", "POST");
      expect(result.next).toHaveBeenCalledTimes(1);
      expect(result.end).not.toHaveBeenCalled();
    }
  });

  it("rewrites only existing directory indexes, preserving queries and a coincidentally repeated base", async () => {
    const files = fixture();
    write(files.outDir, "site/flat.html", FLAT);
    const { guard, fallback } = await install(files, "/site/");
    for (const [url, expected] of [
      ["/site/news/item?x=1", "/site/news/item/?x=1"],
      ["/site?x=1", "/site/?x=1"],
      ["/site/missing?x=1", "/site/missing?x=1"],
      ["/site/flat?x=1", "/site/flat?x=1"],
      ["/site/site/flat.html", "/site/site/flat.html"],
    ]) {
      const result = invoke(guard, url!);
      expect(result.req.url).toBe(expected);
      expect(result.next).toHaveBeenCalledTimes(1);
      expect(result.end).not.toHaveBeenCalled();
    }
    expect(invoke(fallback, "/site/flat.html").next).toHaveBeenCalledTimes(1);
  });

  it("rejects traversal, malformed encoding, Windows aliases and outside-base requests before static serving", async () => {
    const { guard, fallback } = await install(fixture(), "/site/");
    const unsafe = [
      "/../outside/secret.html",
      "/%2e%2e/outside/secret.html",
      "/%252e%252e/secret.html",
      "/news/../flat.html",
      "/news/./item",
      "/%2foutside",
      "/%5coutside",
      "/%00",
      "/bad%",
      "/C:/secret",
      "/news\\item",
      "//outside",
      "/flat.html.",
      "/flat.html%20",
      "/con",
      "/aux.html",
    ];
    for (const url of unsafe) {
      expect(invoke(guard, `/site${url}`).end, url).toHaveBeenCalledWith(NOT_FOUND);
      expect(invoke(fallback, url).end, url).toHaveBeenCalledWith(NOT_FOUND);
    }
    for (const url of [
      "/",
      "/index.html",
      "/other",
      "/site-other/",
      "/s%69te/flat.html",
      "https://example.test/site/",
    ]) {
      const result = invoke(guard, url);
      expect(result.next, url).not.toHaveBeenCalled();
      expect(result.end, url).toHaveBeenCalledWith(NOT_FOUND);
    }
  });

  it.each(["missing", "directory", "link"])("fails startup for a %s 404 document", async (kind) => {
    const files = fixture();
    const fallback = path.join(files.outDir, "404.html");
    fs.unlinkSync(fallback);
    if (kind === "directory") fs.mkdirSync(fallback);
    if (kind === "link") fs.symlinkSync(path.join(files.root, "outside"), fallback, "junction");
    await expect(install(files)).rejects.toThrow(/requires an existing regular .*404\.html/);
  });

  it("rejects symlinked HTML files even when they would resolve inside the output", async () => {
    const files = fixture();
    const { guard, fallback } = await install(files);
    const original = fs.lstatSync.bind(fs);
    // File symlinks require extra Windows privileges; directory junctions are
    // exercised on disk below. Simulate just the link's lstat, not middleware.
    vi.spyOn(fs, "lstatSync").mockImplementation((file) => {
      const stat = original(file);
      if (file === path.join(files.outDir, "flat.html")) stat.isSymbolicLink = () => true;
      return stat;
    });
    expect(invoke(guard, "/flat").end).toHaveBeenCalledWith(NOT_FOUND);
    expect(invoke(guard, "/flat.html").end).toHaveBeenCalledWith(NOT_FOUND);
    expect(invoke(fallback, "/flat.html").end).toHaveBeenCalledWith(NOT_FOUND);
  });

  it("rejects SPA configuration, unsafe bases and missing output at startup", async () => {
    const files = fixture();
    await expect(install(files, "/", { appType: "spa" })).rejects.toThrow(/appType: mpa/);
    for (const base of ["https://example.test/site/", "/site/../", "/site", "/%73ite/", "//"])
      await expect(install(files, base)).rejects.toThrow(/root-relative base/);
    await expect(install(files, "/", { build: { outDir: "dist/missing" } })).rejects.toThrow(
      /404\.html/,
    );
  });
});

describe("installed Vite preview, temporary static artifacts only", () => {
  it.each(["/", "/site/", "/team/site/"])(
    "serves exact files and real 404s under %s",
    async (base) => {
      vi.stubEnv("VITE_TENANT_ID", undefined);
      const files = fixture();
      write(files.outDir, "site/flat.html", FLAT);
      fs.symlinkSync(
        path.join(files.root, "outside"),
        path.join(files.outDir, "linked"),
        "junction",
      );
      fs.symlinkSync(
        path.join(files.outDir, "news"),
        path.join(files.outDir, "internal-link"),
        "junction",
      );
      const server = await preview({
        ...(await configured(true)),
        configFile: false,
        envFile: false,
        root: files.root,
        base,
        build: { outDir: "dist/fixture" },
        preview: { host: "127.0.0.1", port: 0, strictPort: true },
        logLevel: "silent",
      });
      servers.push(server);
      expect(version).toMatch(/^7\./);
      expect(server.config.appType).toBe("mpa");
      const address = server.httpServer.address();
      if (!address || typeof address === "string") throw new Error("Expected a loopback port");
      const prefix = base.slice(0, -1);
      const known: [string, Buffer][] = [
        ["/", HOME],
        ["/index.html?x=1", HOME],
        ["/news/item", DEEP],
        ["/news/item/?x=1", DEEP],
        ["/news/item/index.html", DEEP],
        ["/flat?x=1", FLAT],
        ["/flat.html", FLAT],
        ["/a%20space", FLAT],
        ["/site/flat", FLAT],
        ["/assets/data.bin?x=1", ASSET],
        ["/404.html", NOT_FOUND],
      ];
      for (const [url, expected] of known) {
        const response = await get(address.port, `${prefix}${url}`);
        expect(response.status, url).toBe(200);
        expect(response.body, url).toEqual(expected);
        expect(response.headers.location, url).toBeUndefined();
      }
      if (prefix) {
        const root = await get(address.port, `${prefix}?x=1`);
        expect(root.status).toBe(200);
        expect(root.body).toEqual(HOME);
      }
      const head = await get(address.port, `${prefix}/news/item`, "HEAD");
      expect(head.status).toBe(200);
      expect(head.body).toHaveLength(0);

      const missing = [
        "/unknown",
        "/unknown/deep?x=1",
        "/missing.html",
        "/missing.bin",
        "/news/item/unknown",
        "/../../outside/secret.html",
        "/%2e%2e/%2e%2e/outside/secret.html",
        "/news/../flat.html",
        "/%252e%252e/secret.html",
        "/bad%",
        "/%2foutside",
        "/linked/secret.html",
        "/linked/secret.bin",
        "/internal-link/item",
        "/internal-link/item/index.html",
      ].map((url) => `${prefix}${url}`);
      if (prefix) missing.push("/", "/index.html", "/other", `${prefix}-other/flat.html`);
      for (const url of missing) {
        for (const method of ["GET", "HEAD"]) {
          const response = await get(address.port, url, method, "*/*");
          expect(response.status, `${method} ${url}`).toBe(404);
          expect(response.body, `${method} ${url}`).toEqual(
            method === "HEAD" ? Buffer.alloc(0) : NOT_FOUND,
          );
          expect(response.headers["content-type"]).toBe("text/html; charset=utf-8");
          expect(response.headers["content-length"]).toBe(String(NOT_FOUND.length));
          expect(response.headers.location).toBeUndefined();
        }
      }
      // A different method must not bypass the pre-static link/traversal guard.
      expect((await get(address.port, `${prefix}/linked/secret.bin`, "POST")).status).toBe(404);
    },
  );
});
