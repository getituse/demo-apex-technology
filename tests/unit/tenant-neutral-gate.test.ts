import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Not fileURLToPath(import.meta.url): under Vitest's jsdom environment import.meta.url
// is not a file:// URL and fileURLToPath throws "The URL must be of scheme file".
const ROOT = process.cwd();

/**
 * The tenant-neutrality gate is the mechanical half of the white-label contract,
 * so it needs a test that proves it still fails on a real violation.
 */
describe("tenant-neutral gate", () => {
  const script = path.join(ROOT, "scripts", "check-tenant-neutral.mjs");
  const fixtureDir = path.join(ROOT, "src", "components", "ui");
  const fixture = path.join(fixtureDir, "__vitest-gate-fixture.tsx");

  function runGate() {
    try {
      execFileSync(process.execPath, [script], { cwd: ROOT, encoding: "utf8" });
      return { code: 0, output: "" };
    } catch (e) {
      const err = e as { status: number; stdout?: string; stderr?: string };
      return { code: err.status, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
    }
  }

  it("passes on a clean tree", () => {
    expect(runGate().code).toBe(0);
  });

  it.each([
    ["tenant name", `export const a = "Greenfield";`, "tenant-name"],
    ["domain word", `export const a = "Admissions open";`, "domain-word"],
    ["raw hex", `export const a = "#ff0000";`, "raw-hex"],
    ["palette class", `export const a = "bg-blue-600";`, "palette-class"],
  ])("fails on %s", (_label, contents, ruleId) => {
    fs.mkdirSync(fixtureDir, { recursive: true });
    fs.writeFileSync(fixture, contents);
    try {
      const { code, output } = runGate();
      expect(code).toBe(1);
      expect(output).toContain(ruleId);
    } finally {
      fs.rmSync(fixture, { force: true });
    }
  });

  it("honours the ignore marker", () => {
    fs.mkdirSync(fixtureDir, { recursive: true });
    fs.writeFileSync(fixture, `// tenant-neutral-ignore: fixture\nexport const a = "#ff0000";`);
    try {
      expect(runGate().code).toBe(0);
    } finally {
      fs.rmSync(fixture, { force: true });
    }
  });
});
