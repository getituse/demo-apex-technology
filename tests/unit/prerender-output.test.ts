// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { normalizePrerenderOutput } from "../../scripts/lib/prerender-output.mjs";

const temporary: string[] = [];
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "prerender-output-"));
  temporary.push(root);
  return root;
}
function write(root: string, file: string, contents = file) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), contents);
}
function snapshot(root: string): Record<string, string> {
  const entries: Record<string, string> = {};
  function visit(directory: string) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      const relative = path.relative(root, file).split(path.sep).join("/");
      if (entry.isSymbolicLink()) entries[relative] = `link:${fs.readlinkSync(file)}`;
      else if (entry.isDirectory()) {
        entries[`${relative}/`] = "directory";
        visit(file);
      } else entries[relative] = fs.readFileSync(file).toString("base64");
    }
  }
  visit(root);
  return entries;
}
afterEach(() => {
  for (const root of temporary.splice(0))
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});

describe("basename prerender packaging", () => {
  it.each(["/repo", "/repo/", "/team/site", "/team/site/"])(
    "moves only known HTML/data for %s, including root and canonical aliases",
    (base) => {
      const root = fixture();
      const prefix = base.replace(/^\//, "").replace(/\/$/, "");
      const routes = ["/", "/about", "/faculty/alex", "/about/people/alex"];
      const files = [
        "index.html",
        "_root.data",
        "about/index.html",
        "faculty/alex/index.html",
        "faculty/alex.data",
        "about/people/alex/index.html",
        "about/people/alex.data",
      ];
      for (const file of files) write(root, `${prefix}/${file}`, `generated:${file}`);
      expect(normalizePrerenderOutput(root, base, routes).sort()).toEqual(files.sort());
      for (const file of files)
        expect(fs.readFileSync(path.join(root, file), "utf8")).toBe(`generated:${file}`);
      expect(fs.existsSync(path.join(root, "about.data"))).toBe(false);
      expect(fs.existsSync(path.join(root, prefix.split("/")[0]!))).toBe(false);
    },
  );

  it.each(["/repo", "/team/site"])(
    "does not strip a coincidentally matching route prefix for %s",
    (base) => {
      const root = fixture();
      const routes = [`${base}${base}`, base, "/"];
      for (const route of routes) {
        const local = route === "/" ? "" : route.slice(1);
        write(root, `${base.slice(1)}/${local}/index.html`, `html:${route}`);
        write(root, `${base.slice(1)}/${local ? `${local}.data` : "_root.data"}`, `data:${route}`);
      }
      normalizePrerenderOutput(root, base, routes);
      for (const route of routes) {
        const local = route === "/" ? "" : route.slice(1);
        expect(fs.readFileSync(path.join(root, local, "index.html"), "utf8")).toBe(`html:${route}`);
        expect(
          fs.readFileSync(path.join(root, local ? `${local}.data` : "_root.data"), "utf8"),
        ).toBe(`data:${route}`);
      }
      expect(fs.existsSync(path.join(root, base.slice(1), base.slice(1), base.slice(1)))).toBe(
        false,
      );
    },
  );

  it("preserves resources at root, beneath basename, and beside generated documents", () => {
    const root = fixture();
    const resources = [
      "assets/app.js",
      "fonts/font.woff2",
      "tenants/logo.svg",
      "__spa-fallback.html",
      "repo/assets/app.js",
      "repo/manual.pdf",
      "repo/unknown/index.html",
      "repo/unknown.data",
      "repo/about/photo.png",
      "about/existing.pdf",
      "about.data", // Optional source data is absent: this public file is not ours.
    ];
    for (const resource of resources) write(root, resource);
    fs.mkdirSync(path.join(root, "repo/assets/empty"), { recursive: true });
    write(root, "repo/index.html");
    write(root, "repo/about/index.html");
    normalizePrerenderOutput(root, "/repo", ["/", "/about"]);
    for (const resource of resources)
      expect(fs.readFileSync(path.join(root, resource), "utf8")).toBe(resource);
    expect(fs.statSync(path.join(root, "repo/assets/empty")).isDirectory()).toBe(true);
  });

  it("does not remove an assets directory even when used as the basename", () => {
    const root = fixture();
    write(root, "assets/index.html");
    normalizePrerenderOutput(root, "/assets", ["/"]);
    expect(fs.statSync(path.join(root, "assets")).isDirectory()).toBe(true);
  });

  it.each(["index.html", "_root.data", "about/index.html", "about.data", "about"])(
    "preflights collision at %s without any mutation",
    (collision) => {
      const root = fixture();
      for (const file of ["index.html", "_root.data", "about/index.html", "about.data"])
        write(root, `repo/${file}`);
      write(root, collision, "unrelated public content");
      const before = snapshot(root);
      expect(() => normalizePrerenderOutput(root, "/repo", ["/", "/about"])).toThrow(/collision/);
      expect(snapshot(root)).toEqual(before);
    },
  );

  it("rejects directory/file collisions, even an empty destination directory", () => {
    const root = fixture();
    write(root, "repo/index.html");
    fs.mkdirSync(path.join(root, "index.html"));
    const before = snapshot(root);
    expect(() => normalizePrerenderOutput(root, "/repo", ["/"])).toThrow(/collision/);
    expect(snapshot(root)).toEqual(before);
  });

  it.each([
    "repo",
    "https://example.com/repo",
    "//repo",
    "//",
    "/repo//",
    "/a//b",
    "/a/../b",
    "/a/./b",
    "/%2e%2e",
    "/a%2fb",
    "/a?x",
    "/a#x",
    "/a\\b",
    "/a\u0000",
    "/a\n",
    "/a ",
    "/C:/file",
    "/con",
    "/aux",
    "/UPPER",
  ])("rejects malformed base and route %j without touching files", (invalid) => {
    const root = fixture();
    write(root, "repo/index.html");
    const before = snapshot(root);
    expect(() => normalizePrerenderOutput(root, invalid, ["/"])).toThrow(/Invalid basename/);
    expect(() => normalizePrerenderOutput(root, "/repo", ["/", invalid])).toThrow(/Invalid route/);
    expect(snapshot(root)).toEqual(before);
  });

  it("rejects duplicate and noncanonical route paths before mutation", () => {
    const root = fixture();
    write(root, "repo/index.html");
    const before = snapshot(root);
    expect(() => normalizePrerenderOutput(root, "/repo", ["/", "/"])).toThrow(/Duplicate/);
    for (const route of ["", "/about/", "/file.html", "/a_b"])
      expect(() => normalizePrerenderOutput(root, "/repo", [route])).toThrow(/Invalid route/);
    expect(snapshot(root)).toEqual(before);
  });

  it.each(["/", "/about"])("fails on missing HTML for %s before moving any data", (missing) => {
    const root = fixture();
    write(root, "repo/_root.data");
    write(root, "repo/about.data");
    write(root, missing === "/" ? "repo/about/index.html" : "repo/index.html");
    const before = snapshot(root);
    expect(() => normalizePrerenderOutput(root, "/repo", ["/", "/about"])).toThrow(
      /Missing prerender HTML/,
    );
    expect(snapshot(root)).toEqual(before);
  });

  it.each(["", "/"])("is a filesystem no-op at the root basename %j", (base) => {
    const root = fixture();
    write(root, "index.html");
    write(root, "_root.data");
    write(root, "assets/app.js");
    const before = snapshot(root);
    expect(normalizePrerenderOutput(root, base, ["/", "/unbuilt"])).toEqual([]);
    expect(snapshot(root)).toEqual(before);
    expect(normalizePrerenderOutput(path.join(root, "missing-directory"), base, ["/"])).toEqual([]);
  });

  it.each(["source", "destination", "root"])(
    "rejects %s directory links without touching their target",
    (location) => {
      const root = fixture();
      const outside = fixture();
      write(outside, "index.html", "outside");
      write(root, "repo/index.html");
      write(root, "repo/about/index.html");
      const link =
        location === "source" ? "repo/linked" : location === "root" ? "linked-root" : "about";
      fs.symlinkSync(
        outside,
        path.join(root, link),
        process.platform === "win32" ? "junction" : "dir",
      );
      const before = snapshot(root);
      const beforeOutside = snapshot(outside);
      try {
        expect(() =>
          normalizePrerenderOutput(
            location === "root" ? path.join(root, link) : root,
            "/repo",
            location === "source" ? ["/", "/linked"] : ["/", "/about"],
          ),
        ).toThrow(/Unsafe/);
        expect(snapshot(root)).toEqual(before);
        expect(snapshot(outside)).toEqual(beforeOutside);
      } finally {
        fs.unlinkSync(path.join(root, link));
      }
    },
  );
});
