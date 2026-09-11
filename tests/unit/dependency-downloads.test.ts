// @vitest-environment node
import { createHash } from "node:crypto";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FETCH_TIMEOUT_MS,
  MIRROR_REGISTRY,
  npmInstallArgs,
  verificationProject,
  verifyLockedArchive,
} from "../../scripts/lib/dependency-downloads.mjs";

const archive = Buffer.from([0x1f, 0x8b, 0, 0]);
const integrity = `sha512-${createHash("sha512").update(archive).digest("base64")}`;
const entry = {
  version: "1.2.3",
  resolved: "https://registry.npmjs.org/fixture/-/fixture-1.2.3.tgz",
  integrity,
  optional: true,
  dev: true,
};
const source = {
  packages: { "node_modules/clsx": entry, "node_modules/@esbuild/win32-x64": entry },
};

describe("mirror installation arguments", () => {
  it("uses public lock URLs through the approved mirror with TLS and measured deadlines", () => {
    const args = npmInstallArgs("C:/Node with spaces/npm-cli.js");
    expect(args.slice(0, 3)).toEqual(["--use-system-ca", "C:/Node with spaces/npm-cli.js", "ci"]);
    expect(args).toContain(`--registry=${MIRROR_REGISTRY}`);
    expect(args).toContain("--replace-registry-host=always");
    expect(args).toContain("--strict-ssl=true");
    expect(args).toContain(`--fetch-timeout=${FETCH_TIMEOUT_MS}`);
    expect(FETCH_TIMEOUT_MS).toBe(900000);
    expect(args).toContain("--fetch-retries=2");
    expect(args).toContain("--package-lock-only=false");
    expect(args).toContain("--dry-run=false");
    expect(args).toContain("--global=false");
    expect(args).not.toContain("--ignore-scripts");
    expect(args.join(" ")).not.toMatch(/legacy-peer-deps|--force|strict-ssl=false/);
  });

  it("isolates verification cache, requires fresh downloads and disables lifecycle scripts", () => {
    const args = npmInstallArgs("npm-cli.js", "C:/temporary cache");
    expect(args).toContain("--cache=C:/temporary cache");
    expect(args).toContain("--logs-dir=C:/temporary cache/_logs");
    expect(args).toContain("--offline=false");
    expect(args).toContain("--prefer-online");
    expect(args).toContain("--ignore-scripts");
    expect(args).toContain("--fetch-retries=0");
    expect(args).not.toContain("--fetch-retries=2");
  });

  it("keeps project registry portable and explicitly enables certificate checks", () => {
    const config = fs.readFileSync(".npmrc", "utf8");
    expect(config).toMatch(/^registry=https:\/\/registry\.npmjs\.org\/$/m);
    expect(config).toMatch(/^strict-ssl=true$/m);
    expect(config).toMatch(/^fetch-timeout=900000$/m);
  });
});

describe("isolated verification project", () => {
  it("requires both locked packages without mutating the application lock", () => {
    const original = structuredClone(source);
    const project = verificationProject(source);
    expect(project.manifest.dependencies).toEqual({ clsx: "1.2.3", "@esbuild/win32-x64": "1.2.3" });
    expect(project.lock.lockfileVersion).toBe(3);
    expect(Object.keys(project.lock.packages)).toHaveLength(3);
    expect(project.lock.packages["node_modules/clsx"]).toEqual({
      version: entry.version,
      resolved: entry.resolved,
      integrity,
    });
    expect(source).toEqual(original);
  });

  it.each([
    { version: "../invalid" },
    { resolved: "http://registry.npmjs.org/fixture.tgz" },
    { resolved: "https://registry.npmjs.org.evil.test/fixture.tgz" },
    { resolved: "https://user:secret@registry.npmjs.org/fixture.tgz" },
    { integrity: "sha512-invalid" },
    { integrity: undefined },
  ])("rejects invalid locked artifact %j", (override) => {
    expect(() =>
      verificationProject({
        packages: { ...source.packages, "node_modules/clsx": { ...entry, ...override } },
      }),
    ).toThrow("INVALID_LOCKED_ARTIFACT");
  });

  it.each([null, {}, { packages: {} }])("rejects incomplete lock %j", (lock) => {
    expect(() => verificationProject(lock)).toThrow("INVALID_LOCKED_ARTIFACT");
  });
});

describe("download integrity", () => {
  it("accepts exact gzip bytes and rejects corrupt or partial downloads", () => {
    expect(verifyLockedArchive(archive, integrity)).toBe(true);
    expect(verifyLockedArchive(archive.subarray(0, 2), integrity)).toBe(false);
    expect(verifyLockedArchive(Buffer.from([0x1f, 0x8b, 1, 0]), integrity)).toBe(false);
  });

  it("rejects HTML even when its checksum matches", () => {
    const html = Buffer.from("<html>Access denied</html>");
    expect(
      verifyLockedArchive(html, `sha512-${createHash("sha512").update(html).digest("base64")}`),
    ).toBe(false);
  });
});
