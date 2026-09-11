// @vitest-environment node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, it, onTestFinished } from "vitest";

function fixture(mode = "ok") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "resource-check-"));
  onTestFinished(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "scripts"));
  fs.copyFileSync(
    "scripts/check-resource-access.mjs",
    path.join(root, "scripts/check-resource-access.mjs"),
  );
  const archive = Buffer.from([0x1f, 0x8b, 0, 0]);
  fs.writeFileSync(
    path.join(root, "package-lock.json"),
    JSON.stringify({
      packages: Object.fromEntries(
        ["clsx", "@esbuild/win32-x64"].map((name) => [
          `node_modules/${name}`,
          {
            version: "1.0.0",
            resolved: `https://registry.npmjs.org/${name}/-/fixture.tgz`,
            integrity: `sha512-${createHash("sha512").update(archive).digest("base64")}`,
          },
        ]),
      ),
    }),
  );
  // No real networking in unit tests: every fetch is replaced before the diagnostic loads.
  fs.writeFileSync(
    path.join(root, "mock.mjs"),
    `
import assert from "node:assert/strict";
globalThis.fetch = async (url, options) => {
  assert.ok(options.signal instanceof AbortSignal);
  const host = new URL(url).host;
  const mode = ${JSON.stringify(mode)};
  if (mode === "timeout") throw new DOMException("secret-proxy-url", "TimeoutError");
  if (mode === "partial") return new Response(new ReadableStream({
    start(controller) { controller.enqueue(Uint8Array.from([31, 139])); },
    pull(controller) { controller.error(new DOMException("secret-proxy-url", "TimeoutError")); }
  }));
  if (mode === "oversized") return new Response(new Uint8Array(12 * 1024 * 1024 + 1));
  if (mode === "denied" && host === "registry.npmjs.org") return new Response("policy", { status: 403 });
  if (host === "fonts.googleapis.com") return new Response(mode === "missing-font" ? "@font-face {}" : "@font-face { src: url(https://fonts.gstatic.com/fixture.woff2); }");
  if (host === "fonts.gstatic.com") return new Response(mode === "html-font" ? "<html>policy</html>" : "wOF2fixture");
  assert.ok(["registry.npmjs.org", "artifacts.devops.bfsaws.net"].includes(host));
  return new Response(Uint8Array.from(mode === "corrupt" ? [31, 139, 1, 0] : [31, 139, 0, 0]));
};
`,
  );
  return {
    run(args: string[] = [], insecure = false) {
      const result = spawnSync(
        process.execPath,
        [
          "--import",
          pathToFileURL(path.join(root, "mock.mjs")).href,
          path.join(root, "scripts/check-resource-access.mjs"),
          ...args,
        ],
        {
          encoding: "utf8",
          // Cold Node startup exceeded 10s while the Windows process tests ran concurrently.
          timeout: 60000,
          shell: false,
          env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: insecure ? "0" : "1" },
        },
      );
      expect(result.error, result.stderr).toBeUndefined();
      return result;
    },
    report(nativeOnly = false) {
      return JSON.parse(
        fs.readFileSync(
          path.join(
            root,
            "build",
            nativeOnly ? "resource-access-native.json" : "resource-access.json",
          ),
          "utf8",
        ),
      ) as {
        results: {
          label: string;
          ok: boolean;
          error?: string;
          bytes?: number;
          status?: number;
          headersMilliseconds?: number;
        }[];
      };
    },
  };
}

it("verifies all sixteen downloads without a real network or install", () => {
  const probe = fixture();
  const result = probe.run();
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  expect(probe.report().results).toHaveLength(16);
  expect(probe.report().results.every((row) => row.ok)).toBe(true);
});

it.each(["denied", "corrupt", "missing-font", "html-font"])("fails honestly on %s", (mode) => {
  const probe = fixture(mode);
  const result = probe.run();
  expect(result.status, result.stderr).toBe(1);
  expect(probe.report().results.some((row) => !row.ok)).toBe(true);
});

it("limits native retry to one request and saves a sanitized timeout", () => {
  const probe = fixture("timeout");
  const result = probe.run(["--native-only"]);
  expect(result.status).toBe(1);
  expect(probe.report(true).results).toHaveLength(1);
  expect(probe.report(true).results[0]?.error).toBe("TimeoutError");
  expect(result.stdout).not.toContain("secret-proxy-url");
  expect(JSON.stringify(probe.report(true))).not.toContain("secret-proxy-url");
});

it("rejects unknown arguments and disabled TLS before fetching", () => {
  const probe = fixture();
  expect(probe.run(["--unknown"]).status).toBe(1);
  const result = probe.run([], true);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("requires TLS verification");
});

it("distinguishes partial body timeout from an HTTP denial", () => {
  const probe = fixture("partial");
  expect(probe.run(["--native-only"]).status).toBe(1);
  expect(probe.report(true).results[0]).toMatchObject({
    status: 200,
    bytes: 2,
    error: "TimeoutError",
  });
  expect(probe.report(true).results[0]?.headersMilliseconds).toBeTypeOf("number");
});

it("reports oversized responses without saving downloaded bytes", () => {
  const probe = fixture("oversized");
  expect(probe.run(["--native-only"]).status).toBe(1);
  expect(probe.report(true).results[0]?.error).toBe("RESPONSE_SIZE_LIMIT");
});
