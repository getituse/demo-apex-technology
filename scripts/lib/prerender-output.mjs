import fs from "node:fs";
import path from "node:path";

// Match the application's unencoded, lowercase route vocabulary, on every OS.
const LOCAL_PATH = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/;
const DEVICE_NAME = /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])$/;

function localPath(value, label, isBase = false) {
  if (typeof value !== "string") throw new Error(`Invalid ${label}: expected a local path`);
  const normalized = isBase
    ? value === "" || value === "/"
      ? "/"
      : value.replace(/\/$/, "")
    : value;
  if (
    (isBase && value === "//") ||
    /\s/.test(normalized) ||
    !LOCAL_PATH.test(normalized) ||
    normalized.split("/").some((segment) => DEVICE_NAME.test(segment))
  )
    throw new Error(`Invalid ${label}: expected an unencoded local kebab-case path`);
  return normalized;
}

/** Inspect every existing ancestor; never follow a public symlink or junction. */
function inspect(root, relative) {
  const segments = relative.split(path.sep);
  let current = root;
  for (let index = 0; index < segments.length; index++) {
    current = path.join(current, segments[index]);
    const stat = fs.lstatSync(current, { throwIfNoEntry: false });
    if (!stat) return undefined;
    if (stat.isSymbolicLink()) throw new Error(`Unsafe output symlink: ${current}`);
    if (index < segments.length - 1 && !stat.isDirectory())
      throw new Error(`Output path collision: ${current} is not a directory`);
    if (index === segments.length - 1) return stat;
  }
}

/**
 * RR 7.18 prefixes generated HTML/data with basename, but not public files/assets.
 * Move ONLY the supplied document routes' index.html and optional legacy .data.
 * Paths are app-relative (including aliases); never strip a prefix from a route.
 * Call once, after prerender, in a quiescent build directory. Resource routes and
 * v8_trailingSlashAwareDataRequests are intentionally not supported.
 * All missing-HTML, collision and symlink checks finish before the first write.
 * Returns app-relative filenames moved, using forward slashes.
 */
export function normalizePrerenderOutput(clientDirectory, basename, routePaths) {
  const base = localPath(basename, "basename", true);
  if (!Array.isArray(routePaths)) throw new Error("Invalid routes: expected an array");
  const routes = routePaths.map((route) => localPath(route, "route"));
  if (new Set(routes).size !== routes.length) throw new Error("Duplicate prerender route");
  if (typeof clientDirectory !== "string" || !path.isAbsolute(clientDirectory))
    throw new Error("Expected an absolute client directory");
  // Includes the empty URL pathname. No filesystem access or output validation at root.
  if (base === "/" || routes.length === 0) return [];

  const root = path.resolve(clientDirectory);
  const rootStat = fs.lstatSync(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory())
    throw new Error("Unsafe client directory: expected a real directory");
  const prefix = base.slice(1).split("/");
  const moves = [];
  for (const route of routes) {
    const segments = route === "/" ? [] : route.slice(1).split("/");
    const html = path.join(...segments, "index.html");
    const data = route === "/" ? "_root.data" : `${path.join(...segments)}.data`;
    for (const [destination, required] of [
      [html, true],
      [data, false],
    ]) {
      const source = path.join(...prefix, destination);
      const stat = inspect(root, source);
      if (!stat) {
        if (required) throw new Error(`Missing prerender HTML: ${source}`);
        continue; // A document without a loader need not have a data file.
      }
      if (!stat.isFile()) throw new Error(`Expected generated file: ${source}`);
      moves.push({ source, destination });
    }
  }
  const sources = new Set(moves.map((move) => move.source));
  for (const { destination } of moves) {
    const stat = inspect(root, destination);
    if (stat && (!stat.isFile() || !sources.has(destination)))
      throw new Error(`Output path collision: ${destination}`);
  }

  // A destination can be another generated source (/repo plus route /repo).
  // Shortest source first vacates that path before its deeper replacement arrives.
  // Exclusive copy protects unrelated files even if a new collision appears later;
  // unlink only after successful copy so an I/O failure cannot lose source bytes.
  moves.sort((left, right) => left.source.length - right.source.length);
  const sourceDirectories = new Set();
  for (const { source, destination } of moves) {
    const target = path.join(root, destination);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, source), target, fs.constants.COPYFILE_EXCL);
    fs.unlinkSync(path.join(root, source));
    for (
      let directory = path.dirname(source);
      directory !== ".";
      directory = path.dirname(directory)
    )
      sourceDirectories.add(directory);
  }
  // Never recursively remove a directory or enumerate unrelated public resources.
  // Leave assets directories alone even when a basename/route happens to use that name.
  for (const directory of [...sourceDirectories].sort(
    (left, right) => right.length - left.length,
  )) {
    if (directory.split(path.sep).includes("assets")) continue;
    const stat = inspect(root, directory);
    if (!stat?.isDirectory()) continue;
    try {
      fs.rmdirSync(path.join(root, directory));
    } catch (error) {
      if (error.code !== "ENOTEMPTY" && error.code !== "EEXIST") throw error;
    }
  }
  return moves.map(({ destination }) => destination.split(path.sep).join("/"));
}
