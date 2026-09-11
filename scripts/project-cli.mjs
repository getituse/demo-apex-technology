#!/usr/bin/env node
/**
 * Shell-independent project validation using installed Node entry points.
 *
 * Usage: node scripts/project-cli.mjs check|lint|typecheck|format|format:check
 * Formatting optionally accepts [--] <paths/globs/options>; the default is ".".
 * Validation modes deliberately reject extra arguments so gates cannot be skipped.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRETTIER_BIN = "node_modules/prettier/bin/prettier.cjs";
const FORMAT_CHECK = {
  name: "format:check",
  bin: PRETTIER_BIN,
  args: ["--check", "."],
};
const LINT = [
  { name: "eslint", bin: "node_modules/eslint/bin/eslint.js", args: ["."] },
  { name: "tenant neutrality", bin: "scripts/check-tenant-neutral.mjs", args: [] },
];
const TYPECHECK = [
  { name: "typegen", bin: "node_modules/@react-router/dev/bin.js", args: ["typegen"] },
  { name: "tsc", bin: "node_modules/typescript/bin/tsc", args: ["--noEmit"] },
];
const PLANS = {
  check: [
    FORMAT_CHECK,
    ...LINT,
    ...TYPECHECK,
    { name: "contrast", bin: "scripts/check-contrast.mjs", args: [] },
    { name: "vitest", bin: "node_modules/vitest/vitest.mjs", args: ["run"] },
  ],
  lint: LINT,
  typecheck: TYPECHECK,
};

function getSteps(command, extraArgs) {
  if (command === "format" || command === "format:check") {
    // Strip only the forwarding separator; preserve all later argument boundaries.
    const args = extraArgs[0] === "--" ? extraArgs.slice(1) : extraArgs;
    return [
      {
        name: command,
        bin: PRETTIER_BIN,
        args: [command === "format" ? "--write" : "--check", ...(args.length ? args : ["."])],
      },
    ];
  }

  if (!Object.hasOwn(PLANS, command)) {
    throw new Error(
      `unknown command "${command ?? "(none)"}". ` +
        "Usage: node scripts/project-cli.mjs check|lint|typecheck|format|format:check",
    );
  }
  if (extraArgs.length > 0) {
    throw new Error(`"${command}" does not accept arguments.`);
  }
  return PLANS[command];
}

function runStep(step) {
  // Only fixed entry points above select executables, never environment variables.
  const bin = path.join(ROOT, step.bin);
  if (!fs.existsSync(bin)) {
    throw new Error(`missing ${step.bin}. Install project dependencies before retrying.`);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, ...step.args], {
      cwd: ROOT,
      shell: false,
      stdio: "inherit",
    });
    child.once("error", reject);
    // Wait for close, not exit: the step's output must finish before the next step.
    child.once("close", (code, signal) => {
      if (signal) reject(new Error(`terminated by signal ${signal}`));
      else if (code === null) reject(new Error("closed without an exit code"));
      else resolve(code);
    });
  });
}

async function main() {
  const [command, ...extraArgs] = process.argv.slice(2);
  const steps = getSteps(command, extraArgs);
  for (const step of steps) {
    console.log(`\n=== ${step.name} ===`);
    let code;
    try {
      code = await runStep(step);
    } catch (error) {
      console.error(
        `project-cli: ${step.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 1;
    }
    if (code !== 0) {
      console.error(`project-cli: ${step.name} failed (exit ${code}).`);
      return code;
    }
  }
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(`project-cli: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  },
);
