import { createHash } from "node:crypto";

export const MIRROR_REGISTRY = "https://artifacts.devops.bfsaws.net/artifactory/api/npm/NPM/";
export const FETCH_TIMEOUT_MS = 900000;
export const PROBE_PACKAGES = ["clsx", "@esbuild/win32-x64"];

export function npmInstallArgs(npmBin, cache) {
  return [
    "--use-system-ca",
    npmBin,
    "ci",
    `--registry=${MIRROR_REGISTRY}`,
    "--replace-registry-host=always",
    "--strict-ssl=true",
    `--fetch-timeout=${FETCH_TIMEOUT_MS}`,
    "--global=false",
    "--workspaces=false",
    "--package-lock=true",
    "--package-lock-only=false",
    "--dry-run=false",
    `--fetch-retries=${cache ? 0 : 2}`,
    "--no-audit",
    "--no-fund",
    ...(cache
      ? [
          "--ignore-scripts",
          "--prefer-online",
          "--offline=false",
          "--include=prod",
          `--cache=${cache}`,
          `--logs-dir=${cache}/_logs`,
          "--loglevel=error",
        ]
      : []),
  ];
}

export function verificationProject(lock) {
  const dependencies = {};
  const packages = {};
  for (const name of PROBE_PACKAGES) {
    const entry = lock?.packages?.[`node_modules/${name}`];
    if (
      typeof entry?.version !== "string" ||
      !/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(entry.version) ||
      typeof entry.resolved !== "string" ||
      !entry.resolved.startsWith("https://registry.npmjs.org/") ||
      typeof entry.integrity !== "string" ||
      !/^sha512-[A-Za-z0-9+/]{86}==$/.test(entry.integrity)
    ) {
      throw new Error("INVALID_LOCKED_ARTIFACT");
    }
    dependencies[name] = entry.version;
    packages[`node_modules/${name}`] = {
      version: entry.version,
      resolved: entry.resolved,
      integrity: entry.integrity,
    };
  }
  const manifest = {
    name: "isolated-dependency-verification",
    version: "1.0.0",
    private: true,
    dependencies,
  };
  return {
    manifest,
    lock: {
      name: manifest.name,
      version: manifest.version,
      lockfileVersion: 3,
      requires: true,
      packages: { "": manifest, ...packages },
    },
  };
}

export function verifyLockedArchive(archive, expected) {
  return (
    archive.subarray(0, 2).toString("hex") === "1f8b" &&
    `sha512-${createHash("sha512").update(archive).digest("base64")}` === expected
  );
}
