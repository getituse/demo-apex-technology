#!/usr/bin/env node
/**
 * Offline integration audit, run explicitly: node scripts/verify-base-path.mjs
 * Copies source/public/configs into a disposable project, builds Apex at /site,
 * then runs the existing SEO audit. Never builds or changes the original tenants.
 * Uses installed packages and Chromium only; no install/download fallback.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { rawConfig } from "../src/site/config.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TENANT = rawConfig.id;
const SITE_URL = "https://pages.example.com/site";
const INPUTS = [
  "src",
  "public",
  "scripts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "react-router.config.ts",
  "vite.config.ts",
  "tailwind.config.ts",
  "postcss.config.mjs",
];

function copyInputs(fixture) {
  for (const input of INPUTS)
    fs.cpSync(path.join(ROOT, input), path.join(fixture, input), {
      recursive: true,
      force: false,
      errorOnExist: true,
      filter(source) {
        const stat = fs.lstatSync(source);
        assert(
          !stat.isSymbolicLink() && (stat.isDirectory() || stat.isFile()),
          `Refusing a linked/special fixture input: ${source}`,
        );
        return true;
      },
    });
}

function linkDependencies(fixture, links) {
  const installed = fs.realpathSync(path.join(ROOT, "node_modules"));
  const local = path.join(fixture, "node_modules");
  fs.mkdirSync(local);
  const link = (source, destination) => {
    assert(fs.statSync(source).isDirectory(), `Not an installed package directory: ${source}`);
    fs.symlinkSync(
      fs.realpathSync(source),
      destination,
      process.platform === "win32" ? "junction" : "dir",
    );
    links.push(destination);
  };
  // Keep node_modules itself local: a single junction there would let Vite write
  // .vite/.vite-temp into the ORIGINAL dependency tree. Link packages, not caches.
  // Node entry points are used directly, so neither .bin nor npm shims are needed.
  for (const name of fs.readdirSync(installed)) {
    if (name.startsWith(".")) continue;
    const source = path.join(installed, name);
    const destination = path.join(local, name);
    if (name.startsWith("@")) {
      fs.mkdirSync(destination);
      for (const child of fs.readdirSync(source))
        link(path.join(source, child), path.join(destination, child));
    } else link(source, destination);
  }
}

function configureFixture(fixture) {
  const file = path.join(fixture, "src", "site", "config.ts");
  let source = fs.readFileSync(file, "utf8");
  const replaceOnce = (pattern, replacement, label) => {
    assert.equal([...source.matchAll(pattern)].length, 1, `Fixture ${label} shape changed`);
    source = source.replace(pattern, replacement);
  };
  // Intentionally fail on an unfamiliar authored shape, rather than risk a broad
  // replacement or silently omit the parent noindex regression.
  replaceOnce(/\bsiteUrl:\s*"[^"\r\n]*"/g, `siteUrl: ${JSON.stringify(SITE_URL)}`, "siteUrl");
  replaceOnce(
    /(^[ \t]*about:\s*\{)([^{}]*)(\})/gm,
    (_match, opening, properties, closing) => {
      assert(!/\bseo\s*:/.test(properties), "Fixture about SEO already configured");
      return `${opening} seo: { robots: "noindex,nofollow" },${properties}${closing}`;
    },
    "about parent",
  );
  fs.writeFileSync(file, source, "utf8");
}

function runNode(label, args, fixture, reportDirectory) {
  const log = path.join(reportDirectory, `${label}.log`);
  fs.writeFileSync(log, `node ${args.join(" ")}\n`, "utf8");
  const startedAt = new Date().toISOString();
  console.log(`\n=== base-path fixture: ${label} ===`);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: fixture,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });
    let failure;
    const forward = (destination) => (chunk) => {
      destination.write(chunk);
      try {
        fs.appendFileSync(log, chunk);
      } catch (error) {
        // Continue draining/waiting for the child before fixture cleanup. Lost
        // evidence is a failure, even if the child eventually exits successfully.
        failure ??= `Unable to persist ${label} log: ${error.message}`;
      }
    };
    child.stdout.on("data", forward(process.stdout));
    child.stderr.on("data", forward(process.stderr));
    child.on("error", (error) => {
      failure = error.message;
      console.error(`Unable to start ${label}: ${failure}`);
    });
    child.on("close", (exitCode, signal) => {
      resolve({
        label,
        args,
        startedAt,
        finishedAt: new Date().toISOString(),
        exitCode,
        signal,
        error: failure ?? null,
        log: path.basename(log),
        ok: exitCode === 0 && signal === null && !failure,
      });
    });
  });
}

export async function main(args = process.argv.slice(2)) {
  const output = path.join(ROOT, "build", "base-path-audit");
  fs.mkdirSync(output, { recursive: true });
  // Preserve failed/earlier runs rather than overwriting their evidence on retry.
  const reportDirectory = fs.mkdtempSync(path.join(output, "run-"));
  const reportFile = path.join(reportDirectory, "report.json");
  const report = {
    startedAt: new Date().toISOString(),
    ok: false,
    complete: false,
    exitCode: 1,
    tenant: TENANT,
    siteUrl: SITE_URL,
    parentNoindex: "about",
    fixture: null,
    fixtureRemoved: false,
    stages: [],
    errors: [],
    limitations: [
      "One isolated Apex /site production build; nested basenames and collisions are unit fixtures.",
      "Existing installed dependencies/Chromium required; no packages, fonts or browsers downloaded.",
      "Loopback SEO/browser audit, not live hosting, search-engine eligibility or a deployment.",
      "Package directories are linked read-only by convention; Vite cache directories remain fixture-local.",
      "Unexpected I/O/process termination can leave partial output or a temporary fixture; no crash-atomic guarantee.",
    ],
  };
  const save = () => fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  const recordError = (error) => {
    const message = error instanceof Error ? error.message : String(error);
    report.errors.push(message);
    console.error(`FAIL base-path fixture: ${message}`);
  };
  let fixture;
  const links = [];
  try {
    save();
    assert.equal(args.length, 0, "Usage: node scripts/verify-base-path.mjs (no arguments)");
    fixture = fs.mkdtempSync(path.join(os.tmpdir(), "config-prod-base-path-"));
    report.fixture = fixture;
    save();
    copyInputs(fixture);
    linkDependencies(fixture, links);
    configureFixture(fixture);
    const stages = [
      ["build", [path.join(fixture, "node_modules", "@react-router", "dev", "bin.js"), "build"]],
      ["seo", [path.join(fixture, "scripts", "verify-seo-output.mjs")]],
    ];
    for (const [label, command] of stages) {
      const result = await runNode(label, command, fixture, reportDirectory);
      report.stages.push(result);
      save();
      if (!result.ok) {
        report.exitCode =
          Number.isInteger(result.exitCode) && result.exitCode > 0 ? result.exitCode : 1;
        throw new Error(
          `${label} failed: exit=${result.exitCode}, signal=${result.signal}, error=${result.error}`,
        );
      }
    }
    const seoReportFile = fs.existsSync(
      path.join(fixture, "build", `seo-output-audit-${TENANT}.json`),
    )
      ? path.join(fixture, "build", `seo-output-audit-${TENANT}.json`)
      : path.join(fixture, "build", "seo-output-audit.json");
    const seoReport = JSON.parse(fs.readFileSync(seoReportFile, "utf8"));
    assert(
      seoReport.complete === true && seoReport.ok === true,
      "SEO child exited zero without a completed passing report",
    );
    assert.equal(seoReport.tenants.length, 1, "Expected only the fixture tenant in the SEO audit");
    const tenant = seoReport.tenants[0];
    assert.equal(tenant.id, TENANT);
    assert.equal(tenant.ok, true);
    assert(tenant.counters.indexable > 0, "Fixture sitemap must not be empty");
    assert(
      tenant.counters.indexable < tenant.counters.expectedRoutes - tenant.counters.aliases,
      "Parent noindex did not exclude any canonical routes from the actual sitemap audit",
    );
    // The existing verifier parses XML and compares the exact indexable manifest,
    // including inherited parent robots. Keep that result, not a synthetic pass.
    report.complete = true;
  } catch (error) {
    recordError(error);
  } finally {
    if (fixture) {
      // Preserve the child's detailed report on failure too, before deleting it.
      try {
        const seoFile = path.join(fixture, "build", `seo-output-audit-${TENANT}.json`);
        if (fs.existsSync(seoFile))
          fs.copyFileSync(
            seoFile,
            path.join(reportDirectory, "seo-output-audit.json"),
            fs.constants.COPYFILE_EXCL,
          );
      } catch (error) {
        recordError(error);
      }
      // Unlink explicitly so recursive cleanup cannot reach installed packages.
      let detached = true;
      for (const link of links) {
        try {
          fs.unlinkSync(link);
        } catch (error) {
          detached = false;
          recordError(error);
        }
      }
      if (detached) {
        try {
          fs.rmSync(fixture, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
          report.fixtureRemoved = true;
        } catch (error) {
          recordError(error);
        }
      }
    }
    report.ok = report.complete && report.errors.length === 0 && report.fixtureRemoved;
    if (report.ok) report.exitCode = 0;
    report.finishedAt = new Date().toISOString();
    save();
    console.log(`BASE_PATH_AUDIT_EXIT=${report.exitCode}; report=${reportFile}`);
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
    .then((report) => {
      process.exitCode = report.exitCode;
    })
    .catch((error) => {
      console.error("BASE_PATH_AUDIT_EXIT=1: unable to finish/save audit", error);
      process.exitCode = 1;
    });
}
