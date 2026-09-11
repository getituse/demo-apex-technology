// @vitest-environment node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, onTestFinished } from "vitest";

// Independent expectations: no real formatter, build tool or test suite is launched.
const STEPS = [
  { name: "format:check", bin: "node_modules/prettier/bin/prettier.cjs", args: ["--check", "."] },
  { name: "eslint", bin: "node_modules/eslint/bin/eslint.js", args: ["."] },
  { name: "tenant neutrality", bin: "scripts/check-tenant-neutral.mjs", args: [] },
  { name: "typegen", bin: "node_modules/@react-router/dev/bin.js", args: ["typegen"] },
  { name: "tsc", bin: "node_modules/typescript/bin/tsc", args: ["--noEmit"] },
  { name: "contrast", bin: "scripts/check-contrast.mjs", args: [] },
  { name: "vitest", bin: "node_modules/vitest/vitest.mjs", args: ["run"] },
] as const;

interface FixtureOptions {
  failAt?: string;
  fault?: "throw" | "error" | "signal" | "null-exit";
  missingBin?: string;
}

interface Invocation {
  phase: "start" | "end";
  name: string;
  args: string[];
  cwd: string;
}

// Valid in .cjs, .js and .mjs entry points. Each child records completion separately
// so overlapping launches cannot masquerade as a serial validation run.
const MOCK_BIN = `
Promise.all([import("node:fs"), import("node:path")]).then(([{ default: fs }, { default: path }]) => {
  const root = process.cwd();
  const options = JSON.parse(fs.readFileSync(path.join(root, "fixture-options.json"), "utf8"));
  const invocation = { name, args: process.argv.slice(2), cwd: root };
  const record = (phase) => fs.appendFileSync(
    path.join(root, "invocations.jsonl"), JSON.stringify({ phase, ...invocation }) + "\\n",
  );
  record("start");
  setImmediate(() => {
    record("end");
    console.log("stdout:" + name);
    console.error("stderr:" + name);
    process.exitCode = options.failAt === name ? 7 : 0;
  });
});
`;

// Observe the copied runner only; its mock children do not inherit --import.
// Synthetic spawn faults exercise Windows/POSIX error paths deterministically,
// without permissions changes, shell executables or platform-specific signals.
const SPAWN_OBSERVER = `
import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(fs.readFileSync(path.join(root, "fixture-options.json"), "utf8"));
const original = childProcess.spawn;
childProcess.spawn = (executable, args, options) => {
  assert.equal(executable, process.execPath);
  assert.equal(options.cwd, root);
  assert.equal(options.shell, false);
  assert.equal(options.stdio, "inherit");
  fs.appendFileSync(path.join(root, "spawns.jsonl"), JSON.stringify(args) + "\\n");
  if (fixture.fault === "throw") throw new Error("injected synchronous launch failure");
  if (fixture.fault) {
    const child = new EventEmitter();
    process.nextTick(() => {
      if (fixture.fault === "error") child.emit("error", new Error("injected spawn error"));
      child.emit("close", null, fixture.fault === "signal" ? "SIGTERM" : null);
    });
    return child;
  }
  return original(executable, args, options);
};
syncBuiltinESMExports();
`;

function createFixture(options: FixtureOptions = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "project cli regression "));
  onTestFinished(() => {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  function write(relativePath: string, content: string) {
    const destination = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, "utf8");
  }

  function readLog<T>(filename: string): T[] {
    const log = path.join(root, filename);
    if (!fs.existsSync(log)) return [];
    return fs
      .readFileSync(log, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as T);
  }

  write(
    "scripts/project-cli.mjs",
    fs.readFileSync(path.join(process.cwd(), "scripts/project-cli.mjs"), "utf8"),
  );
  write("fixture-options.json", JSON.stringify(options));
  write("spawn-observer.mjs", SPAWN_OBSERVER);
  for (const step of STEPS) {
    if (step.bin !== options.missingBin) {
      write(step.bin, `const name = ${JSON.stringify(step.name)};\n${MOCK_BIN}`);
    }
  }
  fs.mkdirSync(path.join(root, "unrelated cwd"));

  return {
    root,
    calls: () => readLog<Invocation>("invocations.jsonl"),
    spawns: () => readLog<string[]>("spawns.jsonl"),
    run(...args: string[]) {
      return spawnSync(
        process.execPath,
        [
          "--import",
          pathToFileURL(path.join(root, "spawn-observer.mjs")).href,
          path.join(root, "scripts/project-cli.mjs"),
          ...args,
        ],
        {
          cwd: path.join(root, "unrelated cwd"),
          shell: false,
          encoding: "utf8",
          // A check launches seven real Node children; cold Windows starts exceed 10s under load.
          timeout: 60000,
          env: { ...process.env, VITE_TENANT_ID: "../../not-a-tenant" },
        },
      );
    },
  };
}

describe("project CLI validation", () => {
  it.each([
    { mode: "check", steps: STEPS },
    { mode: "lint", steps: STEPS.slice(1, 3) },
    { mode: "typecheck", steps: STEPS.slice(3, 5) },
  ])("runs $mode serially using Node, inherited output and fixed root paths", ({ mode, steps }) => {
    const fixture = createFixture();
    const result = fixture.run(mode);

    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(fixture.spawns()).toEqual(
      steps.map((step) => [path.join(fixture.root, step.bin), ...step.args]),
    );
    expect(fixture.calls()).toEqual(
      steps.flatMap((step) =>
        ["start", "end"].map((phase) => ({
          phase,
          name: step.name,
          args: [...step.args],
          cwd: fixture.root,
        })),
      ),
    );
    for (const step of steps) {
      expect(result.stdout).toContain(`stdout:${step.name}`);
      expect(result.stderr).toContain(`stderr:${step.name}`);
    }
  });

  it.each(STEPS)("stops check immediately when $name exits nonzero", (step) => {
    const fixture = createFixture({ failAt: step.name });
    const result = fixture.run("check");
    const expectedSteps = STEPS.slice(0, STEPS.indexOf(step) + 1);

    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(7);
    expect(result.stderr).toContain(`${step.name} failed (exit 7)`);
    expect(fixture.spawns()).toHaveLength(expectedSteps.length);
    expect(fixture.calls().map((call) => call.name)).toEqual(
      expectedSteps.flatMap((item) => [item.name, item.name]),
    );
  });

  it.each([
    { args: [] },
    { args: ["constructor"] },
    { args: ["__proto__"] },
    { args: ["../../lint"] },
    { args: ["check", "--"] },
    { args: ["lint", "--fix"] },
    { args: ["typecheck", "--skipLibCheck"] },
  ])("rejects invalid command arguments $args before spawning", ({ args }) => {
    const fixture = createFixture();
    const result = fixture.run(...args);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("project-cli:");
    expect(fixture.spawns()).toEqual([]);
  });

  it("fails clearly at a missing entry point without running later steps", () => {
    const fixture = createFixture({ missingBin: STEPS[1].bin });
    const result = fixture.run("check");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`eslint: missing ${STEPS[1].bin}`);
    expect(fixture.spawns()).toHaveLength(1);
  });

  it.each([
    { fault: "throw", message: "injected synchronous launch failure" },
    { fault: "error", message: "injected spawn error" },
    { fault: "signal", message: "terminated by signal SIGTERM" },
    { fault: "null-exit", message: "closed without an exit code" },
  ] as const)("fails closed on $fault without starting another step", ({ fault, message }) => {
    const fixture = createFixture({ fault });
    const result = fixture.run("check");

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`format:check: ${message}`);
    expect(fixture.spawns()).toHaveLength(1);
    expect(fixture.calls()).toEqual([]);
  });
});

describe.each(["format", "format:check"])("project CLI %s", (mode) => {
  it.each([
    { args: [], forwarded: ["."] },
    { args: ["--"], forwarded: ["."] },
    { args: ["src/a file.ts", "src/**/*.tsx"], forwarded: ["src/a file.ts", "src/**/*.tsx"] },
    {
      args: ["--", "src/a file.ts", "--ignore-unknown"],
      forwarded: ["src/a file.ts", "--ignore-unknown"],
    },
    { args: ["--", "--", "a; echo unexpected"], forwarded: ["--", "a; echo unexpected"] },
  ])(
    "forwards $args as literal arguments, with a default project target",
    ({ args, forwarded }) => {
      const fixture = createFixture();
      const result = fixture.run(mode, ...args);

      expect(result.status, result.stderr).toBe(0);
      expect(fixture.spawns()).toEqual([
        [
          path.join(fixture.root, STEPS[0].bin),
          mode === "format" ? "--write" : "--check",
          ...forwarded,
        ],
      ]);
    },
  );
});

describe("project validation launchers", () => {
  it("routes only the five validation/formatting scripts through the Node runner", () => {
    const manifest = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    for (const mode of ["check", "lint", "typecheck", "format", "format:check"]) {
      expect(manifest.scripts[mode]).toBe(`node scripts/project-cli.mjs ${mode}`);
    }
    expect(Object.values(manifest.scripts).some((script) => script.includes("&&"))).toBe(false);
  });

  it("keeps every VS Code task shell-free with shared arguments and workspace cwd", () => {
    const config = JSON.parse(fs.readFileSync(".vscode/tasks.json", "utf8")) as {
      tasks: {
        label: string;
        type: string;
        command: string;
        args: string[];
        windows: { command: string; args?: string[] };
        options: { cwd: string };
      }[];
    };
    expect(config.tasks.map((task) => task.label)).toEqual([
      "Quality gate",
      "Build production site",
      "Dev site (port 5412)",
      "Preview production site (port 5412)",
      "Validate TypeScript",
      "Validate lint",
      "Check theme contrast",
      "Test unit and components (vitest)",
      "Test production E2E (Playwright)",
      "Verify static output",
      "Verify SEO output",
      "Verify responsive layouts",
      "Verify public pages",
      "Format code",
      "Format check",
    ]);
    for (const task of config.tasks) {
      expect(task.type).toBe("process");
      expect(task.command).toBe("node");
      expect(task.windows.command).toMatch(/node\.exe$/i);
      expect(task.windows.args ?? task.args).toEqual(task.args);
      expect(task.options.cwd).toBe("${workspaceFolder}");
      expect(task.args.length).toBeGreaterThan(0);
      expect(task.args[0]).not.toMatch(/npm|powershell|cmd\.exe/i);
    }
  });
});
