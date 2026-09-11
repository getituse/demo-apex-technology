import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MIRROR_REGISTRY,
  FETCH_TIMEOUT_MS,
  PROBE_PACKAGES,
  npmInstallArgs,
  verificationProject,
  verifyLockedArchive,
} from "./lib/dependency-downloads.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmRoot = [
  path.join(path.dirname(process.execPath), "node_modules/npm"),
  path.resolve(path.dirname(process.execPath), "../lib/node_modules/npm"),
].find((candidate) => fs.existsSync(path.join(candidate, "bin/npm-cli.js")));
if (!npmRoot) throw new Error("npm must be installed alongside the selected Node executable");
const npmBin = path.join(npmRoot, "bin/npm-cli.js");
const [mode, ...extras] = process.argv.slice(2);
if (!["verify", "install"].includes(mode) || extras.length)
  throw new Error("Usage: dependency-cli.mjs verify|install");
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0")
  throw new Error("TLS verification must be enabled");
if (mode === "install") {
  console.log(
    "Installing locked dependencies through the approved mirror; TLS verification enabled.",
  );
  const result = spawnSync(process.execPath, [...npmInstallArgs(npmBin), `--prefix=${root}`], {
    cwd: root,
    shell: false,
    stdio: "inherit",
  });
  if (result.error || result.status === null)
    console.error("Dependency installation did not complete normally.");
  process.exitCode = result.error || result.status === null ? 1 : result.status;
} else {
  if (process.platform !== "win32" || process.arch !== "x64")
    throw new Error("This native download probe requires Windows x64");
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "dependency-download-"));
  const report = {
    startedAt: new Date().toISOString(),
    registryHost: new URL(MIRROR_REGISTRY).host,
    cacheInitiallyEmpty: true,
    ok: false,
    packages: [],
  };
  const reportFile = path.join(root, "build/dependency-verification.json");
  const save = () => {
    fs.mkdirSync(path.dirname(reportFile), { recursive: true });
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + "\n");
  };
  try {
    save();
    const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
    const project = verificationProject(lock);
    const manifest = project.manifest;
    fs.writeFileSync(path.join(temporary, "package.json"), JSON.stringify(manifest));
    fs.writeFileSync(path.join(temporary, "package-lock.json"), JSON.stringify(project.lock));
    const cache = path.join(temporary, "cache");
    console.log(
      "Fresh-cache npm ci: two locked packages; 15-minute request bound; no lifecycle scripts.",
    );
    const started = Date.now();
    const result = spawnSync(
      process.execPath,
      [...npmInstallArgs(npmBin, cache), `--prefix=${temporary}`],
      {
        cwd: temporary,
        shell: false,
        encoding: "utf8",
        timeout: FETCH_TIMEOUT_MS + 60000,
        maxBuffer: 1024 * 1024,
      },
    );
    report.npmExit = result.status;
    report.milliseconds = Date.now() - started;
    save();
    if (result.error || result.status !== 0) {
      const code = result.stderr?.match(/npm error code ([A-Z0-9_]+)/)?.[1];
      throw new Error(code ?? result.error?.code ?? "NPM_CI_FAILED");
    }
    const require = createRequire(path.join(npmRoot, "package.json"));
    const cacache = require("cacache");
    for (const name of PROBE_PACKAGES) {
      const entry = project.lock.packages[`node_modules/${name}`];
      const archive = await cacache.get.byDigest(path.join(cache, "_cacache"), entry.integrity);
      if (!verifyLockedArchive(archive, entry.integrity)) throw new Error("INTEGRITY_MISMATCH");
      report.packages.push({
        name,
        version: entry.version,
        bytes: archive.length,
        integrityVerified: true,
      });
    }
    const executable = path.join(temporary, "node_modules/@esbuild/win32-x64/esbuild.exe");
    const binary = fs.readFileSync(executable);
    if (binary.subarray(0, 2).toString("ascii") !== "MZ")
      throw new Error("INVALID_NATIVE_EXECUTABLE");
    const smoke = spawnSync(executable, ["--version"], {
      encoding: "utf8",
      shell: false,
      timeout: 10000,
    });
    if (
      smoke.error ||
      smoke.status !== 0 ||
      smoke.stdout.trim() !== manifest.dependencies["@esbuild/win32-x64"]
    )
      throw new Error("NATIVE_SMOKE_FAILED");
    report.nativeVersion = smoke.stdout.trim();
    report.nativeBytes = binary.length;
    report.ok = true;
  } catch (error) {
    report.error = /^[A-Z0-9_]+$/.test(error.message) ? error.message : "VERIFICATION_FAILED";
    process.exitCode = 1;
  } finally {
    try {
      fs.rmSync(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      report.cleanupFailed = true;
      report.ok = false;
      process.exitCode = 1;
    }
    report.finishedAt = new Date().toISOString();
    save();
    console.log(JSON.stringify(report));
  }
}
