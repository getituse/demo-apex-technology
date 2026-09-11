import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");

const SHARED_DIRS = [
  "src/components",
  "src/sections",
  "src/routes",
  "src/lib",
  "src/themes",
  "src/hooks",
  "src/styles",
  "src/config",
  "scripts",
  "public/fonts",
];

const SHARED_FILES = ["src/root.tsx", "src/routes.ts"];

function sha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function collectManifest(baseDir) {
  const manifest = {};

  for (const relDir of SHARED_DIRS) {
    const fullDir = path.join(baseDir, relDir);
    if (!fs.existsSync(fullDir)) continue;

    function walk(currentDir, currentRel) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        const entryRel = path.join(currentRel, entry.name).replace(/\\/g, "/");
        const entryFull = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          walk(entryFull, entryRel);
        } else if (entry.isFile()) {
          manifest[entryRel] = sha256(entryFull);
        }
      }
    }
    walk(fullDir, relDir);
  }

  for (const relFile of SHARED_FILES) {
    const fullFile = path.join(baseDir, relFile);
    if (fs.existsSync(fullFile)) {
      manifest[relFile.replace(/\\/g, "/")] = sha256(fullFile);
    }
  }

  return manifest;
}

function computeCumulativeHash(manifest) {
  const sortedKeys = Object.keys(manifest).sort();
  const hash = crypto.createHash("sha256");
  for (const key of sortedKeys) {
    hash.update(`${key}:${manifest[key]}\n`);
  }
  return hash.digest("hex");
}

export function getEngineManifest(dir = projectRoot) {
  const manifest = collectManifest(dir);
  const cumulative = computeCumulativeHash(manifest);
  return { manifest, cumulative, fileCount: Object.keys(manifest).length };
}

// CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const verifyArg = args.find((a) => a.startsWith("--verify="));
  const isJson = args.includes("--json");

  const current = getEngineManifest(projectRoot);

  if (verifyArg) {
    const targetDir = path.resolve(projectRoot, verifyArg.split("=")[1]);
    if (!fs.existsSync(targetDir)) {
      console.error(`Target directory does not exist: ${targetDir}`);
      process.exit(1);
    }
    const target = getEngineManifest(targetDir);

    const diffs = [];
    const allKeys = new Set([...Object.keys(current.manifest), ...Object.keys(target.manifest)]);

    for (const key of allKeys) {
      if (!current.manifest[key]) {
        diffs.push(`MISSING in local: ${key}`);
      } else if (!target.manifest[key]) {
        diffs.push(`MISSING in target: ${key}`);
      } else if (current.manifest[key] !== target.manifest[key]) {
        diffs.push(`DIFFERENT: ${key}`);
      }
    }

    if (diffs.length > 0) {
      console.error(
        `FAIL: Parity drift detected between ${projectRoot} and ${targetDir} (${diffs.length} differences):`,
      );
      for (const d of diffs) console.error(`  - ${d}`);
      process.exit(1);
    } else {
      console.log(
        `PASS: Engine byte-identical with ${path.basename(targetDir)} (${current.fileCount} files, SHA-256: ${current.cumulative.slice(0, 16)}...)`,
      );
      process.exit(0);
    }
  }

  if (isJson) {
    console.log(JSON.stringify(current, null, 2));
  } else {
    console.log(`Engine Manifest: ${current.fileCount} shared files`);
    console.log(`Cumulative SHA-256: ${current.cumulative}`);
    console.log(`\nRun with --verify=<path-to-sister-repo> to test cross-repository parity.`);
  }
}
