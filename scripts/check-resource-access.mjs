import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Diagnostic only: bounded downloads in memory; no installs, execution or security-setting changes.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
const mirror = "https://artifacts.devops.bfsaws.net/artifactory/api/npm/NPM/";
const publicRegistry = "https://registry.npmjs.org/";
const results = [];
const MAX_BYTES = 12 * 1024 * 1024;
const fontFamilies = ["Inter", "Lexend", "Lora", "Nunito", "Source Sans 3", "Source Serif 4"];
const nativeOnly = process.argv[2] === "--native-only";
if (process.argv.length > (nativeOnly ? 3 : 2)) throw new Error("Unsupported diagnostic argument");
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("This diagnostic requires TLS verification to be enabled");
}

async function download(label, url, validate, timeout = 45000) {
  const start = Date.now();
  let bytes = 0;
  let status;
  let headersMilliseconds;
  console.log(`Checking ${label} (deadline ${timeout / 1000}s)`);
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeout),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      },
    });
    status = response.status;
    headersMilliseconds = Date.now() - start;
    if (!response.ok) {
      await response.body?.cancel();
      results.push({ label, host: new URL(url).host, status: response.status, ok: false });
      console.log(`${label}: HTTP ${response.status}`);
      return null;
    }
    const chunks = [];
    let nextProgress = 1024 * 1024;
    const reader = response.body.getReader();
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BYTES) {
        await reader.cancel();
        throw Object.assign(new Error("Response size limit"), { code: "RESPONSE_SIZE_LIMIT" });
      }
      chunks.push(Buffer.from(chunk.value));
      if (bytes >= nextProgress) {
        console.log(`${label}: ${bytes} bytes received in ${Date.now() - start}ms`);
        nextProgress = bytes + 1024 * 1024;
      }
    }
    const body = Buffer.concat(chunks);
    const checked = validate(body);
    const result = {
      label,
      host: new URL(url).host,
      status: response.status,
      bytes,
      headersMilliseconds,
      validation: checked,
      ok: checked === true,
      milliseconds: Date.now() - start,
    };
    results.push(result);
    console.log(JSON.stringify(result));
    return checked ? body : null;
  } catch (error) {
    // Error codes only: proxy credentials/URLs must never be printed from exception details.
    const code =
      error.name === "TimeoutError" ? error.name : (error.cause?.code ?? error.code ?? error.name);
    const result = {
      label,
      host: new URL(url).host,
      error: String(code),
      status,
      bytes,
      headersMilliseconds,
      ok: false,
      milliseconds: Date.now() - start,
    };
    results.push(result);
    console.log(JSON.stringify(result));
    return null;
  }
}

function matchesIntegrity(body, integrity) {
  const [algorithm, expected] = integrity.split("-");
  return (
    body.subarray(0, 2).toString("hex") === "1f8b" &&
    createHash(algorithm).update(body).digest("base64") === expected
  );
}

for (const name of nativeOnly ? ["@esbuild/win32-x64"] : ["clsx", "@esbuild/win32-x64"]) {
  const entry = lock.packages[`node_modules/${name}`];
  if (!entry?.resolved?.startsWith(publicRegistry) || !entry.integrity) {
    throw new Error(`No public locked tarball/integrity for ${name}`);
  }
  if (!nativeOnly)
    await download(`${name}@${entry.version} public tarball`, entry.resolved, (body) =>
      matchesIntegrity(body, entry.integrity),
    );
  await download(
    `${name}@${entry.version} Artifactory tarball`,
    mirror + entry.resolved.slice(publicRegistry.length),
    (body) => matchesIntegrity(body, entry.integrity),
    name === "@esbuild/win32-x64" ? 900000 : 45000,
  );
}

for (const family of nativeOnly ? [] : fontFamilies) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400&display=swap`;
  const css = await download(`${family} stylesheet`, cssUrl, (body) =>
    body.toString("utf8").includes("@font-face"),
  );
  if (!css) continue;
  const sources = [
    ...css.toString("utf8").matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g),
  ];
  const url = sources.at(-1)?.[1];
  if (url)
    await download(
      `${family} WOFF2 sample`,
      url,
      (body) => body.subarray(0, 4).toString("ascii") === "wOF2",
    );
  else {
    results.push({ label: `${family} WOFF2 sample`, error: "MISSING_WOFF2_SOURCE", ok: false });
    console.log(`${family}: no recognized HTTPS WOFF2 source`);
  }
}

console.log(
  `ACCESS_CHECK_COMPLETE: ${results.filter((result) => result.ok).length}/${results.length} verified downloads`,
);
console.log(
  "TLS verification stayed enabled; fetched bytes were not installed, saved or executed.",
);
const reportFile = path.join(
  root,
  "build",
  nativeOnly ? "resource-access-native.json" : "resource-access.json",
);
fs.mkdirSync(path.dirname(reportFile), { recursive: true });
fs.writeFileSync(
  reportFile,
  JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2) + "\n",
);
process.exitCode = results.every((result) => result.ok) ? 0 : 1;
